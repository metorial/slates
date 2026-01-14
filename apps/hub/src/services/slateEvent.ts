import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Slate } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  slateVersion: {
    include: {
      activeDeployment: true,
      slateVersionDiscoveries: {
        orderBy: { createdAt: 'desc' as const },
        take: 1
      }
    }
  },
  slate: true
};

class slateEventServiceImpl {
  async getSlateEventById(d: { slate: Slate; id: string }) {
    let slateEvent = await db.slateEvent.findFirst({
      where: {
        slateOid: d.slate.oid,
        id: d.id
      },
      include
    });
    if (!slateEvent) throw new ServiceError(notFoundError('slate.event'));
    return slateEvent;
  }

  async listSlateEvents(d: { slate: Slate; versionIds?: string[] }) {
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
          await db.slateEvent.findMany({
            ...opts,
            where: {
              slateOid: d.slate.oid,
              slateVersion: versions ? { oid: { in: versions.map(v => v.oid) } } : undefined
            },
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }

  async listAllEvents(d: { type?: string }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateEvent.findMany({
            ...opts,
            where: d.type ? { type: d.type as any } : undefined,
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }
}

export let slateEventService = Service.create(
  'slateEventService',
  () => new slateEventServiceImpl()
).build();
