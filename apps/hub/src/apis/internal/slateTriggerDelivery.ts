import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { db } from '../../db';
import { getTenantAndSenderForSignal, signal } from '../../signal';
import { app } from './_app';
import { tenantApp } from './tenant';

const resolveSignalEventIds = async (d: {
  tenantOid: bigint;
  triggerEventIds?: string[];
  triggerReceiverId?: string;
}) => {
  if (d.triggerEventIds && d.triggerEventIds.length) {
    let events = await db.slateTriggerEvent.findMany({
      where: {
        id: { in: d.triggerEventIds },
        receiver: { tenantOid: d.tenantOid }
      },
      select: { signalEventId: true }
    });

    return events.map(event => event.signalEventId).filter(Boolean) as string[];
  }

  if (d.triggerReceiverId) {
    let receiver = await db.slateTriggerReceiver.findFirst({
      where: { id: d.triggerReceiverId, tenantOid: d.tenantOid }
    });
    if (!receiver) return [];

    let events = await db.slateTriggerEvent.findMany({
      where: {
        receiverOid: receiver.oid,
        signalEventId: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      select: { signalEventId: true }
    });

    return events.map(event => event.signalEventId!).filter(Boolean) as string[];
  }

  return undefined;
};

const resolveSignalDestinationIds = async (d: {
  tenantOid: bigint;
  destinationIds?: string[];
}) => {
  if (!d.destinationIds || d.destinationIds.length === 0) return undefined;

  let destinations = await db.slateTriggerDestination.findMany({
    where: {
      id: { in: d.destinationIds },
      tenantOid: d.tenantOid
    },
    select: { signalDestinationId: true }
  });

  return destinations.map(dest => dest.signalDestinationId);
};

export let slateTriggerDeliveryController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          triggerReceiverId: v.optional(v.string()),
          triggerEventIds: v.optional(v.array(v.string())),
          destinationIds: v.optional(v.array(v.string())),
          status: v.optional(v.array(v.enumOf(['pending', 'delivered', 'failed', 'retrying'])))
        })
      )
    )
    .do(async ctx => {
      let { tenant: signalTenant } = await getTenantAndSenderForSignal(ctx.tenant);

      let eventIds = await resolveSignalEventIds({
        tenantOid: ctx.tenant.oid,
        triggerEventIds: ctx.input.triggerEventIds,
        triggerReceiverId: ctx.input.triggerReceiverId
      });

      let destinationIds = await resolveSignalDestinationIds({
        tenantOid: ctx.tenant.oid,
        destinationIds: ctx.input.destinationIds
      });

      return await signal.eventDeliveryIntent.list({
        tenantId: signalTenant.id,
        eventIds,
        destinationIds,
        status: ctx.input.status,
        limit: ctx.input.limit,
        after: ctx.input.after,
        before: ctx.input.before,
        cursor: ctx.input.cursor,
        order: ctx.input.order
      });
    }),

  listAttempts: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          triggerReceiverId: v.optional(v.string()),
          triggerEventIds: v.optional(v.array(v.string())),
          destinationIds: v.optional(v.array(v.string())),
          status: v.optional(v.array(v.enumOf(['failed', 'succeeded'])))
        })
      )
    )
    .do(async ctx => {
      let { tenant: signalTenant } = await getTenantAndSenderForSignal(ctx.tenant);

      let eventIds = await resolveSignalEventIds({
        tenantOid: ctx.tenant.oid,
        triggerEventIds: ctx.input.triggerEventIds,
        triggerReceiverId: ctx.input.triggerReceiverId
      });

      let destinationIds = await resolveSignalDestinationIds({
        tenantOid: ctx.tenant.oid,
        destinationIds: ctx.input.destinationIds
      });

      return await signal.eventDeliveryAttempt.list({
        tenantId: signalTenant.id,
        eventIds,
        destinationIds,
        status: ctx.input.status,
        limit: ctx.input.limit,
        after: ctx.input.after,
        before: ctx.input.before,
        cursor: ctx.input.cursor,
        order: ctx.input.order
      });
    }),

  getAttempt: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        eventDeliveryAttemptId: v.string()
      })
    )
    .do(async ctx => {
      let { tenant: signalTenant } = await getTenantAndSenderForSignal(ctx.tenant);

      return await signal.eventDeliveryAttempt.get({
        tenantId: signalTenant.id,
        eventDeliveryAttemptId: ctx.input.eventDeliveryAttemptId
      });
    })
});
