import type {
  SlateSession,
  Slate,
  SlateInstance,
  SlateVersion,
  SlateSpecification,
  Tenant
} from '../../../prisma/generated/client';
import { SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';
import { SlateInstanceFixtures } from './instanceFixtures';
import { TenantFixtures } from './tenantFixtures';

export class SlateSessionFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    tenantOid: bigint;
    instanceOid: bigint;
    versionOid: bigint;
    overrides?: Partial<SlateSession>;
  }): Promise<SlateSession> {
    const { oid, id } = getId('slateSession');

    return this.db.slateSession.create({
      data: {
        oid,
        id,
        slateOid: data.slateOid,
        tenantOid: data.tenantOid,
        slateInstanceOid: data.instanceOid,
        slateVersionOid: data.versionOid,
        ...data.overrides
      }
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    sessionOverrides?: Partial<SlateSession>;
  }): Promise<{
    session: SlateSession;
    slate: Slate & { currentVersion: SlateVersion & { specification: SlateSpecification } };
    instance: SlateInstance;
    version: SlateVersion & { specification: SlateSpecification };
    tenant: Tenant;
  }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default();

    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const instanceFixtures = new SlateInstanceFixtures(this.db);
    const instance = await instanceFixtures.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid
    });

    const session = await this.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      instanceOid: instance.oid,
      versionOid: slate.currentVersion.oid,
      overrides: data?.sessionOverrides
    });

    return {
      session,
      slate,
      instance,
      version: slate.currentVersion,
      tenant
    };
  }
}
