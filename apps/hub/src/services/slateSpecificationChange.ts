import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Slate } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  slate: true,
  fromVersion: true,
  toVersion: true,
  fromSpecification: true,
  toSpecification: true
};

class slateSpecificationChangeServiceImpl {
  async getSlateSpecificationChangeById(d: { slate: Slate; id: string }) {
    let slateSpecificationChange = await db.slateSpecificationChange.findFirst({
      where: {
        slateOid: d.slate.oid,
        id: d.id
      },
      include
    });
    if (!slateSpecificationChange)
      throw new ServiceError(notFoundError('slate.specification_change'));
    return slateSpecificationChange;
  }

  async listSlateSpecificationChanges(d: { slate: Slate; versionIds?: string[] }) {
    let versions = d.versionIds
      ? await db.slateVersion.findMany({
          where: {
            status: 'active',
            OR: [{ id: { in: d.versionIds } }, { version: { in: d.versionIds } }]
          },
          select: { oid: true }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateSpecificationChange.findMany({
            ...opts,
            where: {
              slateOid: d.slate.oid,

              OR: versions
                ? [
                    { fromVersionOid: { in: versions.map(v => v.oid) } },
                    { toVersionOid: { in: versions.map(v => v.oid) } }
                  ]
                : undefined
            },
            include
          })
      )
    );
  }
}

export let slateSpecificationChangeService = Service.create(
  'slateSpecificationChangeService',
  () => new slateSpecificationChangeServiceImpl()
).build();
