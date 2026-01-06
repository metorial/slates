import { conflictError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { getId } from '../id';

let include = {
  tenant: true
};

let baseDomain = env.url.SUB_REGISTRY_BASE_DOMAIN;
if (baseDomain && !baseDomain.startsWith('.')) {
  baseDomain = `.${baseDomain}`;
}

class subRegistryServiceImpl {
  async createSubRegistry(d: {
    input: {
      name: string;
      identifier: string;
    };
    tenant: Tenant;
  }) {
    return db.$transaction(async db => {
      let existingSubRegistry = await db.subRegistry.findFirst({
        where: {
          identifier: d.input.identifier
        }
      });
      if (existingSubRegistry) {
        throw new ServiceError(
          conflictError({
            message: `SubRegistry with identifier ${d.input.identifier} already exists`
          })
        );
      }

      return await db.subRegistry.create({
        data: {
          ...getId('subRegistry'),

          identifier: d.input.identifier,
          name: d.input.name,

          tenantOid: d.tenant.oid
        },
        include
      });
    });
  }

  async getSubRegistryById(d: { id: string; tenant?: Tenant }) {
    let reg = await db.subRegistry.findFirst({
      where: {
        OR: [{ id: d.id }, { identifier: d.id }],
        tenantOid: d.tenant?.oid
      },
      include
    });
    if (!reg) throw new ServiceError(notFoundError('tenant.sub_registry'));
    return reg;
  }

  async getSubRegistryFromUrl(d: { url: string; subRegistryId?: string }) {
    let identifier = d.subRegistryId;

    if (!identifier) {
      if (!baseDomain) return null;

      let url = new URL(d.url);
      let remainingHost = url.hostname.replace(baseDomain, '');
      if (!remainingHost || remainingHost === url.hostname) {
        return null;
      }

      identifier = remainingHost;
    }

    let reg = await db.subRegistry.findFirst({
      where: { identifier },
      include
    });
    if (!reg) throw new ServiceError(notFoundError('tenant.sub_registry'));
    return reg;
  }

  async listSubRegistries(d: { tenant?: Tenant }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.subRegistry.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant?.oid
            },
            include
          })
      )
    );
  }
}

export let subRegistryService = Service.create(
  'subRegistryService',
  () => new subRegistryServiceImpl()
).build();
