import { randomBytes } from 'crypto';
import type { Secret, Tenant } from '../../../prisma/generated/client';
import { SecretStatus, SecretType } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { TenantFixtures } from './tenantFixtures';

export class SecretFixtures extends BaseFixture {
  async default(data: {
    tenantOid: bigint;
    type?: SecretType;
    overrides?: Partial<Secret>;
  }): Promise<Secret> {
    const { oid, id } = getId('secret');

    return this.db.secret.create({
      data: {
        oid,
        id,
        type: data.type ?? SecretType.slate_authentication_configuration,
        status: SecretStatus.active,
        tenantOid: data.tenantOid,
        encryptedSecret: `encrypted_${randomBytes(16).toString('hex')}`,
        ...data.overrides
      }
    });
  }

  async withTenant(data?: {
    type?: SecretType;
    tenantOverrides?: Partial<Tenant>;
    secretOverrides?: Partial<Secret>;
  }): Promise<Secret & { tenant: Tenant }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default(data?.tenantOverrides);

    const secret = await this.default({
      tenantOid: tenant.oid,
      type: data?.type,
      overrides: data?.secretOverrides
    });

    return this.db.secret.findUniqueOrThrow({
      where: { id: secret.id },
      include: { tenant: true }
    }) as Promise<Secret & { tenant: Tenant }>;
  }
}
