import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { getId } from '../id';
import { getTenantAndSenderForSignal, signal } from '../signal';

let include = {};

const normalizeEventTypes = (eventTypes?: string[] | null) =>
  eventTypes && eventTypes.length > 0 ? eventTypes : [];

class slateTriggerDestinationServiceImpl {
  async createTriggerDestination(d: {
    tenant: Tenant;
    input: {
      name: string;
      description?: string;
      url: string;
      method?: 'POST' | 'PUT' | 'PATCH';
      eventTypes?: string[];
      retry?: {
        type: 'linear' | 'exponential';
        delaySeconds: number;
        maxAttempts: number;
      };
    };
  }) {
    let { sender, tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let res = await signal.eventDestination.create({
      tenantId: signalTenant.id,
      senderId: sender.id,
      name: d.input.name,
      description: d.input.description,
      eventTypes: d.input.eventTypes && d.input.eventTypes.length ? d.input.eventTypes : null,
      retry: d.input.retry,
      variant: {
        type: 'http_endpoint',
        url: d.input.url,
        method: d.input.method ?? 'POST'
      }
    });

    return await db.slateTriggerDestination.create({
      data: {
        ...getId('slateTriggerDestination'),

        tenantOid: d.tenant.oid,

        name: res.name,
        description: res.description ?? undefined,
        type: 'http_endpoint',

        url: res.webhook?.url ?? d.input.url,
        method: res.webhook?.method ?? (d.input.method ?? 'POST'),
        eventTypes: normalizeEventTypes(res.eventTypes ?? undefined),
        retry: res.retry ?? null,

        signalDestinationId: res.id,
        signalWebhookId: res.webhook?.id ?? null,
        signalSigningSecret: res.webhook?.signingSecret ?? null
      },
      include
    });
  }

  async updateTriggerDestination(d: {
    tenant: Tenant;
    destinationId: string;
    input: {
      name?: string;
      description?: string;
      url?: string;
      method?: 'POST' | 'PUT' | 'PATCH';
      eventTypes?: string[];
      retry?: {
        type: 'linear' | 'exponential';
        delaySeconds: number;
        maxAttempts: number;
      } | null;
    };
  }) {
    let destination = await db.slateTriggerDestination.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.destinationId
      }
    });
    if (!destination) throw new ServiceError(notFoundError('slate.trigger.destination'));

    let { sender, tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    let res = await signal.eventDestination.update({
      tenantId: signalTenant.id,
      eventDestinationId: destination.signalDestinationId,
      name: d.input.name,
      description: d.input.description,
      eventTypes:
        d.input.eventTypes === undefined
          ? undefined
          : d.input.eventTypes.length
            ? d.input.eventTypes
            : null,
      retry: d.input.retry === undefined ? undefined : d.input.retry ?? undefined,
      variant:
        d.input.url || d.input.method
          ? {
              type: 'http_endpoint',
              url: d.input.url ?? destination.url,
              method: d.input.method ?? (destination.method as 'POST' | 'PUT' | 'PATCH')
            }
          : undefined
    });

    return await db.slateTriggerDestination.update({
      where: { oid: destination.oid },
      data: {
        name: res.name,
        description: res.description ?? undefined,
        url: res.webhook?.url ?? destination.url,
        method: res.webhook?.method ?? destination.method,
        eventTypes: normalizeEventTypes(res.eventTypes ?? undefined),
        retry: res.retry ?? null,
        signalWebhookId: res.webhook?.id ?? destination.signalWebhookId,
        signalSigningSecret: res.webhook?.signingSecret ?? destination.signalSigningSecret
      },
      include
    });
  }

  async deleteTriggerDestination(d: { tenant: Tenant; destinationId: string }) {
    let destination = await db.slateTriggerDestination.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.destinationId
      }
    });
    if (!destination) throw new ServiceError(notFoundError('slate.trigger.destination'));

    let { tenant: signalTenant } = await getTenantAndSenderForSignal(d.tenant);

    await signal.eventDestination.delete({
      tenantId: signalTenant.id,
      eventDestinationId: destination.signalDestinationId
    });

    await db.slateTriggerDestination.delete({
      where: { oid: destination.oid }
    });

    return destination;
  }

  async getTriggerDestinationById(d: { tenant: Tenant; id: string }) {
    let destination = await db.slateTriggerDestination.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.id
      },
      include
    });
    if (!destination) throw new ServiceError(notFoundError('slate.trigger.destination'));
    return destination;
  }

  async listTriggerDestinations(d: { tenant: Tenant }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateTriggerDestination.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant.oid
            },
            include
          })
      )
    );
  }
}

export let slateTriggerDestinationService = Service.create(
  'slateTriggerDestinationService',
  () => new slateTriggerDestinationServiceImpl()
).build();
