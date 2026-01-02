import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Slate } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  slate: true
};

class slateSpecificationServiceImpl {
  async getSlateSpecificationById(d: { slate: Slate; id: string }) {
    let slateSpecification = await db.slateSpecification.findFirst({
      where: {
        slateOid: d.slate.oid,
        id: d.id
      },
      include
    });
    if (!slateSpecification) throw new ServiceError(notFoundError('slate.specification'));
    return slateSpecification;
  }

  async listSlateSpecifications(d: { slate: Slate; versionIds?: string[] }) {
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
          await db.slateSpecification.findMany({
            ...opts,
            where: {
              slateOid: d.slate.oid,
              slateVersions: versions
                ? { some: { oid: { in: versions.map(v => v.oid) } } }
                : undefined
            },
            include
          })
      )
    );
  }
}

export let slateSpecificationService = Service.create(
  'slateSpecificationService',
  () => new slateSpecificationServiceImpl()
).build();
