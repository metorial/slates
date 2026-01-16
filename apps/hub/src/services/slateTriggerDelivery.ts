import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { getTenantAndSenderForSignal, signal } from '../signal';

type DeliveryListInput = {
  triggerReceiverId?: string;
  triggerEventIds?: string[];
  destinationIds?: string[];
  status?: ('pending' | 'delivered' | 'failed' | 'retrying')[];
  limit?: number;
  after?: string;
  before?: string;
  cursor?: string;
  order?: 'asc' | 'desc';
};

type DeliveryAttemptListInput = {
  triggerReceiverId?: string;
  triggerEventIds?: string[];
  destinationIds?: string[];
  status?: ('failed' | 'succeeded')[];
  limit?: number;
  after?: string;
  before?: string;
  cursor?: string;
  order?: 'asc' | 'desc';
};

class slateTriggerDeliveryServiceImpl {
  private async resolveSignalEventIds(d: {
    tenant: Tenant;
    triggerEventIds?: string[];
    triggerReceiverId?: string;
  }) {
    if (d.triggerEventIds?.length) {
      let events = await db.slateTriggerEvent.findMany({
        where: {
          id: { in: d.triggerEventIds },
          receiver: { tenantOid: d.tenant.oid }
        },
        select: { signalEventId: true }
      });

      return events.map(event => event.signalEventId);
    }

    if (d.triggerReceiverId) {
      let receiver = await db.slateTriggerReceiver.findFirst({
        where: { id: d.triggerReceiverId, tenantOid: d.tenant.oid }
      });
      if (!receiver) return [];

      let events = await db.slateTriggerEvent.findMany({
        where: {
          receiverOid: receiver.oid
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
        select: { signalEventId: true }
      });

      return events.map(event => event.signalEventId);
    }

    return undefined;
  }

  private async resolveSignalDestinationIds(d: {
    tenant: Tenant;
    destinationIds?: string[];
  }) {
    if (!d.destinationIds || d.destinationIds.length === 0) return undefined;

    let destinations = await db.slateTriggerDestination.findMany({
      where: {
        id: { in: d.destinationIds },
        tenantOid: d.tenant.oid
      },
      select: { signalDestinationId: true }
    });

    return destinations.map(dest => dest.signalDestinationId);
  }

  async listTriggerDeliveries(d: { tenant: Tenant; input: DeliveryListInput }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let eventIds = await this.resolveSignalEventIds({
      tenant: d.tenant,
      triggerEventIds: d.input.triggerEventIds,
      triggerReceiverId: d.input.triggerReceiverId
    });

    let destinationIds = await this.resolveSignalDestinationIds({
      tenant: d.tenant,
      destinationIds: d.input.destinationIds
    });

    return await signal.eventDeliveryIntent.list({
      tenantId: signalTenant.id,
      eventIds,
      destinationIds,
      status: d.input.status,
      limit: d.input.limit,
      after: d.input.after,
      before: d.input.before,
      cursor: d.input.cursor,
      order: d.input.order
    });
  }

  async listTriggerDeliveryAttempts(d: { tenant: Tenant; input: DeliveryAttemptListInput }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let eventIds = await this.resolveSignalEventIds({
      tenant: d.tenant,
      triggerEventIds: d.input.triggerEventIds,
      triggerReceiverId: d.input.triggerReceiverId
    });

    let destinationIds = await this.resolveSignalDestinationIds({
      tenant: d.tenant,
      destinationIds: d.input.destinationIds
    });

    return await signal.eventDeliveryAttempt.list({
      tenantId: signalTenant.id,
      eventIds,
      destinationIds,
      status: d.input.status,
      limit: d.input.limit,
      after: d.input.after,
      before: d.input.before,
      cursor: d.input.cursor,
      order: d.input.order
    });
  }

  async getTriggerDeliveryAttempt(d: { tenant: Tenant; eventDeliveryAttemptId: string }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    return await signal.eventDeliveryAttempt.get({
      tenantId: signalTenant.id,
      eventDeliveryAttemptId: d.eventDeliveryAttemptId
    });
  }
}

export let slateTriggerDeliveryService = Service.create(
  'slateTriggerDeliveryService',
  () => new slateTriggerDeliveryServiceImpl()
).build();
