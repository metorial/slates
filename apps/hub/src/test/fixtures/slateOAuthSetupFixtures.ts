import type {
  SlateInstanceOAuthSetup,
  SlateOAuthCredentials,
  SlateAuthMethod,
  Slate,
  SlateVersion,
  Tenant,
  Secret
} from '../../../prisma/generated/client';
import {
  SlateInstanceOAuthSetupStatus,
  SecretType,
  SlateStatus
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';
import { TenantFixtures } from './tenantFixtures';
import { SecretFixtures } from './secretFixtures';
import { SlateAuthMethodFixtures } from './slateAuthMethodFixtures';
import { SlateOAuthCredentialsFixtures } from './slateOAuthCredentialsFixtures';

export class SlateOAuthSetupFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    tenantOid: bigint;
    slateVersionOid: bigint;
    authMethodOid: bigint;
    oauthCredentialsOid: bigint;
    secretOid: bigint;
    status?: SlateInstanceOAuthSetupStatus;
    overrides?: Partial<SlateInstanceOAuthSetup>;
  }): Promise<SlateInstanceOAuthSetup> {
    const { oid, id } = getId('slateInstanceOAuthSetup');

    return this.db.slateInstanceOAuthSetup.create({
      data: {
        oid,
        id,
        status: data.status ?? SlateInstanceOAuthSetupStatus.unused,
        redirectUrl: 'https://example.com/callback',
        slateOid: data.slateOid,
        tenantOid: data.tenantOid,
        slateVersionOid: data.slateVersionOid,
        authMethodOid: data.authMethodOid,
        oauthCredentialsOid: data.oauthCredentialsOid,
        secretOid: data.secretOid,
        ...data.overrides
      }
    });
  }

  async forGetMany(data: {
    tenantOid: bigint;
    slateOid: bigint;
    slateVersionOid: bigint;
    authMethodOid: bigint;
    oauthCredentialsOid: bigint;
  }): Promise<SlateInstanceOAuthSetup> {
    const secretFixtures = new SecretFixtures(this.db);
    const secret = await secretFixtures.default({
      tenantOid: data.tenantOid,
      type: SecretType.slate_oauth_setup
    });
    return this.default({
      slateOid: data.slateOid,
      tenantOid: data.tenantOid,
      slateVersionOid: data.slateVersionOid,
      authMethodOid: data.authMethodOid,
      oauthCredentialsOid: data.oauthCredentialsOid,
      secretOid: secret.oid
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    status?: SlateInstanceOAuthSetupStatus;
    setupOverrides?: Partial<SlateInstanceOAuthSetup>;
  }): Promise<{
    setup: SlateInstanceOAuthSetup;
    credentials: SlateOAuthCredentials;
    authMethod: SlateAuthMethod;
    slate: Slate & { currentVersion: SlateVersion };
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

    const authMethodFixtures = new SlateAuthMethodFixtures(this.db);
    const authMethod = await authMethodFixtures.default({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid
    });

    const secretFixtures = new SecretFixtures(this.db);
    const credentialsSecret = await secretFixtures.default({
      tenantOid: tenant.oid,
      type: SecretType.slate_oauth_credentials
    });

    const credentialsFixtures = new SlateOAuthCredentialsFixtures(this.db);
    const credentials = await credentialsFixtures.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      secretOid: credentialsSecret.oid
    });

    const setupSecret = await secretFixtures.default({
      tenantOid: tenant.oid,
      type: SecretType.slate_oauth_setup
    });

    const setup = await this.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      slateVersionOid: slate.currentVersion.oid,
      authMethodOid: authMethod.oid,
      oauthCredentialsOid: credentials.oid,
      secretOid: setupSecret.oid,
      status: data?.status,
      overrides: data?.setupOverrides
    });

    return { setup, credentials, authMethod, slate, tenant, secret: setupSecret };
  }
}
