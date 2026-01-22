import { randomBytes } from 'crypto';
import type {
  SlateTriggerDelivery,
  SlateTriggerDestination,
  SlateTriggerEvent,
  SlateTriggerReceiver,
  Tenant
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateTriggerEventFixtures } from './slateTriggerEventFixtures';
import { SlateTriggerDestinationFixtures } from './slateTriggerDestinationFixtures';

export class SlateTriggerDeliveryFixtures extends BaseFixture {
  async default(data: {
    eventOid: bigint;
    destinationOid: bigint;
    overrides?: Partial<SlateTriggerDelivery>;
  }): Promise<SlateTriggerDelivery> {
    const { oid, id } = getId('slateTriggerDelivery');

    return this.db.slateTriggerDelivery.create({
      data: {
        oid,
        id,
        eventOid: data.eventOid,
        destinationOid: data.destinationOid,
        signalEventId: `signal_${randomBytes(8).toString('hex')}`,
        ...data.overrides
      }
    });
  }

  async complete(data?: {
    deliveryOverrides?: Partial<SlateTriggerDelivery>;
  }): Promise<{
    delivery: SlateTriggerDelivery;
    event: SlateTriggerEvent;
    destination: SlateTriggerDestination;
    receiver: SlateTriggerReceiver;
    tenant: Tenant;
  }> {
    const eventFixtures = new SlateTriggerEventFixtures(this.db);
    const { event, receiver, tenant } = await eventFixtures.complete();

    const destinationFixtures = new SlateTriggerDestinationFixtures(this.db);
    const destination = await destinationFixtures.default({
      tenantOid: tenant.oid
    });

    const delivery = await this.default({
      eventOid: event.oid,
      destinationOid: destination.oid,
      overrides: data?.deliveryOverrides
    });

    return { delivery, event, destination, receiver, tenant };
  }
}
