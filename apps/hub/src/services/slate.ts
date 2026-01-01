import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Registry, Slate, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { getRegistryClient } from '../registry';

let include = {
  registry: true,
  currentVersion: true
};

class slateServiceImpl {
  async getSlateById(d: { id: string; tenant: Tenant }) {
    let slate = await db.slate.findFirst({
      where: {
        id: d.id,
        status: 'active'
      },
      include
    });
    if (!slate) throw new ServiceError(notFoundError('slate'));
    return slate;
  }

  async getSlateRegistryRecord(d: { slate: Slate & { registry: Registry } }) {
    let reg = await getRegistryClient(d.slate.registry);

    let res = await reg.slates[':scopeId'][':slateId'].$get({
      param: {
        scopeId: d.slate.slateScopeIdentifierOnRegistry,
        slateId: d.slate.slateIdentifierOnRegistry
      }
    });
    if (res.status != 200)
      throw new ServiceError(
        badRequestError({
          message: `Failed to fetch slate record from registry: ${res.statusText}`
        })
      );

    return await res.json();
  }

  async listSlates(d: { tenant: Tenant }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slate.findMany({
            ...opts,
            where: {
              status: 'active'
            },
            include
          })
      )
    );
  }
}

export let slateService = Service.create('slateService', () => new slateServiceImpl()).build();
