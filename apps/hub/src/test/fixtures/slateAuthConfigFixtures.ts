import type {
  SlateAuthConfig,
  SlateAuthMethod,
  Slate,
  Tenant,
  Secret,
  Prisma
} from '../../../prisma/generated/client';
import { SlateAuthConfigType, SecretType, type SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

import { TenantFixtures } from './tenantFixtures';
import { SecretFixtures } from './secretFixtures';
import { SlateAuthMethodFixtures } from './slateAuthMethodFixtures';

export class SlateAuthConfigFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    tenantOid: bigint;
    authMethodOid: bigint;
    secretOid: bigint;
    type?: SlateAuthConfigType;
    overrides?: Omit<Partial<Prisma.SlateAuthConfigUncheckedCreateInput>, 'oid' | 'id'>;
  }): Promise<SlateAuthConfig> {
    const { oid, id } = getId('slateAuthConfig');

    return this.db.slateAuthConfig.create({
      data: {
        oid,
        id,
        type: data.type ?? SlateAuthConfigType.manual,
        isProcessing: false,
        slateOid: data.slateOid,
        tenantOid: data.tenantOid,
        authMethodOid: data.authMethodOid,
        secretOid: data.secretOid,
        ...data.overrides
      }
    });
  }

  async withSecret(data: {
    tenantOid: bigint;
    slateOid: bigint;
    authMethodOid: bigint;
  }): Promise<SlateAuthConfig> {
    const secretFixtures = new SecretFixtures(this.db);
    const secret = await secretFixtures.default({
      tenantOid: data.tenantOid,
      type: SecretType.slate_authentication_configuration
    });
    return this.default({
      slateOid: data.slateOid,
      tenantOid: data.tenantOid,
      authMethodOid: data.authMethodOid,
      secretOid: secret.oid
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    type?: SlateAuthConfigType;
    configOverrides?: Omit<Partial<Prisma.SlateAuthConfigUncheckedCreateInput>, 'oid' | 'id'>;
  }): Promise<{
    config: SlateAuthConfig;
    authMethod: SlateAuthMethod;
    slate: Slate;
    tenant: Tenant;
    secret: Secret;
  }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default();

    const authMethodFixtures = new SlateAuthMethodFixtures(this.db);
    const { authMethod, slate } = await authMethodFixtures.withSlate({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus
    });

    const secretFixtures = new SecretFixtures(this.db);
    const secret = await secretFixtures.default({
      tenantOid: tenant.oid,
      type: SecretType.slate_authentication_configuration
    });

    const config = await this.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      authMethodOid: authMethod.oid,
      secretOid: secret.oid,
      type: data?.type,
      overrides: data?.configOverrides
    });

    return { config, authMethod, slate, tenant, secret };
  }
}
