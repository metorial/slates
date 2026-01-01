import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { SecretType, Tenant } from '../../prisma/generated/client';
import { db } from '../db';

let include = {};

class secretServiceImpl {
  async getSecretById(d: { id: string; tenant: Tenant }) {
    let secret = await db.secret.findFirst({
      where: {
        id: d.id,
        status: 'active',
        tenantOid: d.tenant.oid
      },
      include
    });
    if (!secret) throw new ServiceError(notFoundError('secret'));
    return secret;
  }

  async listSecrets(d: { tenant: Tenant; type?: SecretType }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.secret.findMany({
            ...opts,
            where: {
              type: d.type,
              status: 'active',
              tenantOid: d.tenant.oid
            },
            include
          })
      )
    );
  }
}

export let secretService = Service.create(
  'secretService',
  () => new secretServiceImpl()
).build();
