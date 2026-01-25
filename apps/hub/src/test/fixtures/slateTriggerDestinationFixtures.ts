import { randomBytes } from 'crypto';
import type { SlateTriggerDestination, Tenant } from '../../../prisma/generated/client';
import {
  SlateTriggerDestinationType,
  SlateTriggerDestinationStatus
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { TenantFixtures } from './tenantFixtures';

export class SlateTriggerDestinationFixtures extends BaseFixture {
  async default(data: {
    tenantOid: bigint;
    overrides?: Partial<SlateTriggerDestination>;
  }): Promise<SlateTriggerDestination> {
    const { oid, id } = getId('slateTriggerDestination');
    const name = `destination-${randomBytes(4).toString('hex')}`;

    return this.db.slateTriggerDestination.create({
      data: {
        oid,
        id,
        tenantOid: data.tenantOid,
        name,
        type: SlateTriggerDestinationType.http_endpoint,
        status: SlateTriggerDestinationStatus.active,
        url: 'https://example.com/webhook',
        method: 'POST',
        eventTypes: ['*'],
        signalDestinationId: `signal_dest_${randomBytes(8).toString('hex')}`,
        ...data.overrides
      }
    });
  }

  async withTenant(data?: {
    destinationOverrides?: Partial<SlateTriggerDestination>;
  }): Promise<{
    destination: SlateTriggerDestination;
    tenant: Tenant;
  }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default();

    const destination = await this.default({
      tenantOid: tenant.oid,
      overrides: data?.destinationOverrides
    });

    return { destination, tenant };
  }
}
