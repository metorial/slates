import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { getTenantAndSenderForSignal, signal } from '../signal';

type DeliveryListInput = {
  triggerBindingIds?: string[];
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
  triggerBindingIds?: string[];
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
    triggerBindingIds?: string[];
  }) {
    if (d.triggerEventIds?.length) {
      let events = await db.slateTriggerEvent.findMany({
        where: {
          id: { in: d.triggerEventIds },
          receiver: { tenantOid: d.tenant.oid }
        },
        select: { signalEventId: true }
      });

      return events
        .map(event => event.signalEventId)
        .filter((id): id is string => id !== null);
    }

    if (d.triggerBindingIds?.length) {
      let bindings = await db.slateTriggerReceiverTrigger.findMany({
        where: {
          id: { in: d.triggerBindingIds },
          receiver: { tenantOid: d.tenant.oid }
        },
        select: { oid: true }
      });
      if (!bindings.length) return [];

      let events = await db.slateTriggerEvent.findMany({
        where: {
          receiverTriggerOid: { in: bindings.map(binding => binding.oid) }
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: { signalEventId: true }
      });

      return events
        .map(event => event.signalEventId)
        .filter((id): id is string => id !== null);
    }

    return undefined;
  }

  private async resolveSignalDestinationIds(d: { tenant: Tenant; destinationIds?: string[] }) {
    if (!d.destinationIds || d.destinationIds.length === 0) return undefined;

    let destinations = await db.slateTriggerDestination.findMany({
      where: {
        id: { in: d.destinationIds },
        tenantOid: d.tenant.oid
      },
      select: { signalDestinationId: true }
    });

    return destinations
      .map(dest => dest.signalDestinationId)
      .filter((id): id is string => id !== null);
  }

  async listTriggerDeliveries(d: { tenant: Tenant; input: DeliveryListInput }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let eventIds = await this.resolveSignalEventIds({
      tenant: d.tenant,
      triggerEventIds: d.input.triggerEventIds,
      triggerBindingIds: d.input.triggerBindingIds
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

  async getDelivery(d: { tenant: Tenant; eventDeliveryIntentId: string }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    return await signal.eventDeliveryIntent.get({
      tenantId: signalTenant.id,
      eventDeliveryIntentId: d.eventDeliveryIntentId
    });
  }

  async listTriggerDeliveryAttempts(d: { tenant: Tenant; input: DeliveryAttemptListInput }) {
    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let eventIds = await this.resolveSignalEventIds({
      tenant: d.tenant,
      triggerEventIds: d.input.triggerEventIds,
      triggerBindingIds: d.input.triggerBindingIds
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
