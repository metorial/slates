import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Slate, SlateDeployment } from '../../prisma/generated/client';
import { db } from '../db';
import { functionBay, functionBayTenant } from '../functionBay';

let include = {
  slate: {
    include: {
      registry: true
    }
  },
  slateVersion: true
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

    return await functionBay.functionDeployment.getOutput({
      tenantId: functionBayTenant.id,
      functionId: d.slateDeployment.providerDeploymentInfo.functionId,
      functionDeploymentId: d.slateDeployment.providerDeploymentInfo.functionDeploymentId
    });
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
