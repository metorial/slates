import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  receiver: true,
  receiverTrigger: true,
  event: true,
  invocation: true
};

class slateTriggerInvocationServiceImpl {
  async getTriggerInvocationById(d: { tenant: Tenant; id: string }) {
    let invocation = await db.slateTriggerInvocation.findFirst({
      where: {
        id: d.id,
        receiver: { tenantOid: d.tenant.oid }
      },
      include
    });
    if (!invocation) throw new ServiceError(notFoundError('slate.trigger.invocation'));
    return invocation;
  }

  async listTriggerInvocations(d: {
    tenant: Tenant;
    receiverIds?: string[];
    receiverTriggerIds?: string[];
    types?: (
      | 'poll'
      | 'webhook_handle'
      | 'map_event'
      | 'webhook_register'
      | 'webhook_unregister'
    )[];
  }) {
    let receivers = d.receiverIds
      ? await db.slateTriggerReceiver.findMany({
          where: { id: { in: d.receiverIds }, tenantOid: d.tenant.oid }
        })
      : undefined;

    let receiverTriggers = d.receiverTriggerIds
      ? await db.slateTriggerReceiverTrigger.findMany({
          where: { id: { in: d.receiverTriggerIds } }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateTriggerInvocation.findMany({
            ...opts,
            where: {
              receiver: { tenantOid: d.tenant.oid },
              receiverOid: receivers ? { in: receivers.map(r => r.oid) } : undefined,
              receiverTriggerOid: receiverTriggers
                ? { in: receiverTriggers.map(rt => rt.oid) }
                : undefined,
              type: d.types ? { in: d.types } : undefined
            },
            include
          })
      )
    );
  }
}

export let slateTriggerInvocationService = Service.create(
  'slateTriggerInvocationService',
  () => new slateTriggerInvocationServiceImpl()
).build();
