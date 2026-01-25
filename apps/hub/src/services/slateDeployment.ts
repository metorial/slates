import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Slate, SlateDeployment } from '../../prisma/generated/client';
import { db } from '../db';
import { functionBay, functionBayTenant } from '../functionBay';

let include = {
  slate: {
    include: {
      registry: true,
      currentVersion: {
        include: {
          specification: true
        }
      }
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
      return [];
    }

    let res = await functionBay.functionDeployment.getOutput({
      tenantId: functionBayTenant.id,
      functionId: d.slateDeployment.providerDeploymentInfo.functionId,
      functionDeploymentId: d.slateDeployment.providerDeploymentInfo.functionDeploymentId
    });

    return res;
  }

  async listSlateDeployments(d: {
    slate?: Slate;
    versionIds?: string[];
    status?: 'pending' | 'running' | 'succeeded' | 'failed';
  }) {
    let versions = (d.slate || d.versionIds)
      ? await db.slateVersion.findMany({
          where: {
            slateOid: d.slate?.oid,
            OR: d.versionIds
              ? [{ id: { in: d.versionIds } }, { version: { in: d.versionIds } }]
              : undefined
          },
          select: { oid: true }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateDeployment.findMany({
            ...opts,
            where: {
              slateOid: d.slate?.oid,
              slateVersionOid: versions ? { in: versions.map(v => v.oid) } : undefined,
              status: d.status
            },
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
