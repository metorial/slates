import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  receiver: {
    include: {
      sharedConfig: true
    }
  },
  receiverTrigger: {
    include: {
      sharedConfigTrigger: true
    }
  },
  action: true,
  invocation: true
};

class slateTriggerEventServiceImpl {
  async getTriggerEventById(d: { tenant: Tenant; id: string }) {
    let event = await db.slateTriggerEvent.findFirst({
      where: {
        id: d.id,
        receiver: { tenantOid: d.tenant.oid }
      },
      include
    });
    if (!event) throw new ServiceError(notFoundError('slate.trigger.event'));
    return event;
  }

  async listTriggerEvents(d: {
    tenant: Tenant;
    sharedTriggerConfigIds?: string[];
    triggerBindingIds?: string[];
    eventTypes?: string[];
  }) {
    let triggerBindings = d.triggerBindingIds
      ? await db.slateTriggerReceiverTrigger.findMany({
          where: {
            id: { in: d.triggerBindingIds },
            receiver: { tenantOid: d.tenant.oid }
          }
        })
      : undefined;

    let sharedConfigs = d.sharedTriggerConfigIds
      ? await db.slateSharedTriggerConfig.findMany({
          where: {
            id: { in: d.sharedTriggerConfigIds },
            tenantOid: d.tenant.oid
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateTriggerEvent.findMany({
            ...opts,
            where: {
              receiver: {
                tenantOid: d.tenant.oid,
                sharedConfigOid: sharedConfigs
                  ? { in: sharedConfigs.map(config => config.oid) }
                  : undefined
              },
              receiverTriggerOid: triggerBindings
                ? { in: triggerBindings.map(binding => binding.oid) }
                : undefined,
              type: d.eventTypes ? { in: d.eventTypes } : undefined
            },
            include
          })
      )
    );
  }
}

export let slateTriggerEventService = Service.create(
  'slateTriggerEventService',
  () => new slateTriggerEventServiceImpl()
).build();
