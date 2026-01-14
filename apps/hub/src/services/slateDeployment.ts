import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type {
  Slate,
  SlateDeployment,
  SlateDeploymentStatus
} from '../../prisma/generated/client';
import { db } from '../db';
import { functionBay, functionBayTenant } from '../functionBay';

let include = {
  slate: {
    include: {
      registry: true
    }
  },
  slateVersion: {
    include: {
      specification: true
    }
  }
};

class slateDeploymentServiceImpl {
  async getSlateDeploymentById(d: { slate: Slate; id: string }) {
    let slateDeployment = await db.slateDeployment.findFirst({
      where: {
        slateOid: d.slate.oid,
        id: d.id
      },
      include
    });
    if (!slateDeployment) throw new ServiceError(notFoundError('slate.deployment'));
    return slateDeployment;
  }

  async getBuildOutput(d: { slateDeployment: SlateDeployment }) {
    if (!d.slateDeployment.providerDeploymentInfo) {
      return { output: null };
    }

    let steps = await functionBay.functionDeployment.getOutput({
      tenantId: functionBayTenant.id,
      functionId: d.slateDeployment.providerDeploymentInfo.functionId,
      functionDeploymentId: d.slateDeployment.providerDeploymentInfo.functionDeploymentId
    });

    let output = steps
      .flatMap(step => {
        let statusIndicator = step.status === 'failed' ? ' [FAILED]' : '';
        let header = `=== ${step.name} (${step.type})${statusIndicator} ===\n`;
        let logs = step.logs
          .sort((a, b) => a.timestamp - b.timestamp)
          .map(log => log.message)
          .join('\n');
        return header + logs;
      })
      .join('\n\n');

    return { output: output || null };
  }

  async listSlateDeployments(d: { slate: Slate; versionIds?: string[] }) {
    let versions = d.versionIds
      ? await db.slateVersion.findMany({
          where: {
            status: 'active',
            OR: [{ id: { in: d.versionIds } }, { version: { in: d.versionIds } }]
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateDeployment.findMany({
            ...opts,
            where: {
              slateOid: d.slate.oid,
              slateVersionOid: versions ? { in: versions.map(v => v.oid) } : undefined
            },
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }

  async listAllDeployments(d: { status?: string }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateDeployment.findMany({
            ...opts,
            where: d.status ? { status: d.status as SlateDeploymentStatus } : undefined,
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }
}

export let slateDeploymentService = Service.create(
  'slateDeploymentService',
  () => new slateDeploymentServiceImpl()
).build();
