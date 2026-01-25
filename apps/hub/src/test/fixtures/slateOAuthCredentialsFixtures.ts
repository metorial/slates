import { randomBytes } from 'crypto';
import type {
  SlateOAuthCredentials,
  Slate,
  Tenant,
  Secret
} from '../../../prisma/generated/client';
import { SecretType, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';
import { TenantFixtures } from './tenantFixtures';
import { SecretFixtures } from './secretFixtures';

export class SlateOAuthCredentialsFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    tenantOid: bigint;
    secretOid: bigint;
    overrides?: Partial<SlateOAuthCredentials>;
  }): Promise<SlateOAuthCredentials> {
    const { oid, id } = getId('slateOAuthCredentials');

    return this.db.slateOAuthCredentials.create({
      data: {
        oid,
        id,
        slateOid: data.slateOid,
        tenantOid: data.tenantOid,
        secretOid: data.secretOid,
        clientId: `client_${randomBytes(8).toString('hex')}`,
        scopes: ['read', 'write'],
        ...data.overrides
      }
    });
  }

  async withSecret(data: {
    tenantOid: bigint;
    slateOid: bigint;
  }): Promise<SlateOAuthCredentials> {
    const secretFixtures = new SecretFixtures(this.db);
    const secret = await secretFixtures.default({
      tenantOid: data.tenantOid,
      type: SecretType.slate_oauth_credentials
    });
    return this.default({
      slateOid: data.slateOid,
      tenantOid: data.tenantOid,
      secretOid: secret.oid
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    credentialsOverrides?: Partial<SlateOAuthCredentials>;
  }): Promise<{
    credentials: SlateOAuthCredentials;
    slate: Slate;
    tenant: Tenant;
    secret: Secret;
  }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default();

    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const secretFixtures = new SecretFixtures(this.db);
    const secret = await secretFixtures.default({
      tenantOid: tenant.oid,
      type: SecretType.slate_oauth_credentials
    });

    const credentials = await this.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      secretOid: secret.oid,
      overrides: data?.credentialsOverrides
    });

    return { credentials, slate, tenant, secret };
  }
}
