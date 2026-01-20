import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import {
  SlateTriggerDestinationStatus,
  SlateTriggerReceiverTriggerSource,
  type SlateAuthConfig,
  type Tenant
} from '../../prisma/generated/client';
import { db } from '../db';
import { getId, snowflake } from '../id';
import { slateTriggerWebhookRegisterQueue } from '../queues/trigger/eventQueues';
import { slateSessionService } from './slateSession';
import {
  normalizeEventTypes,
  receiverInclude,
  receiverTriggerInclude
} from './slateTriggerReceiverShared';
import { SlateTriggerReceiverCore } from './slateTriggerReceiverCore';
import { SlateTriggerReceiverRuntime } from './slateTriggerReceiverRuntime';

class slateTriggerReceiverServiceImpl {
  private readonly core: SlateTriggerReceiverCore;
  private readonly runtime: SlateTriggerReceiverRuntime;

  constructor() {
    this.core = new SlateTriggerReceiverCore();
    this.runtime = new SlateTriggerReceiverRuntime(this.core);
  }

  async processTriggerEventInput(
    d: Parameters<SlateTriggerReceiverRuntime['processTriggerEventInput']>[0]
  ) {
    return this.runtime.processTriggerEventInput(d);
  }

  async sendTriggerEvent(d: Parameters<SlateTriggerReceiverRuntime['sendTriggerEvent']>[0]) {
    return this.runtime.sendTriggerEvent(d);
  }

  async registerWebhookForReceiverTrigger(
    d: Parameters<SlateTriggerReceiverRuntime['registerWebhookForReceiverTrigger']>[0]
  ) {
    return this.runtime.registerWebhookForReceiverTrigger(d);
  }

  async registerWebhookForReceiverTriggerId(
    d: Parameters<SlateTriggerReceiverRuntime['registerWebhookForReceiverTriggerId']>[0]
  ) {
    return this.runtime.registerWebhookForReceiverTriggerId(d);
  }

  async unregisterWebhookForReceiverTrigger(
    d: Parameters<SlateTriggerReceiverRuntime['unregisterWebhookForReceiverTrigger']>[0]
  ) {
    return this.runtime.unregisterWebhookForReceiverTrigger(d);
  }

  async unregisterWebhookForReceiverTriggerId(
    d: Parameters<SlateTriggerReceiverRuntime['unregisterWebhookForReceiverTriggerId']>[0]
  ) {
    return this.runtime.unregisterWebhookForReceiverTriggerId(d);
  }

  async pollTriggerReceiverTrigger(
    d: Parameters<SlateTriggerReceiverRuntime['pollTriggerReceiverTrigger']>[0]
  ) {
    return this.runtime.pollTriggerReceiverTrigger(d);
  }

  async handleTriggerWebhook(
    d: Parameters<SlateTriggerReceiverRuntime['handleTriggerWebhook']>[0]
  ) {
    return this.runtime.handleTriggerWebhook(d);
  }

  async createTriggerReceiver(d: {
    tenant: Tenant;
    input: {
      slateInstanceId: string;
      authConfigId?: string;
      name?: string;
      description?: string;
      eventTypes?: string[];
      destinations: string[];
      triggers: { triggerId: string; state?: Record<string, any> | null }[];
    };
  }) {
    let slateInstance = await db.slateInstance.findFirst({
      where: {
        id: d.input.slateInstanceId,
        tenantOid: d.tenant.oid
      },
      include: {
        slate: true,
        currentConfig: true
      }
    });
    if (!slateInstance) throw new ServiceError(notFoundError('slate.instance'));

    if (!slateInstance.currentConfig) {
      throw new ServiceError(
        badRequestError({
          message: 'Provider instance does not have a current configuration set.'
        })
      );
    }

    let slate = slateInstance.slate;
    let version = await slateSessionService.getSessionVersion({ slate, slateInstance });

    let authConfig = await this.core.resolveAuthConfig({
      tenant: d.tenant,
      slate,
      slateInstance,
      authConfigId: d.input.authConfigId,
      hasAuthMethods: (version.specification?.authMethods ?? []).length > 0
    });

    let destinations = await db.slateTriggerDestination.findMany({
      where: {
        tenantOid: d.tenant.oid,
        id: { in: d.input.destinations },
        status: SlateTriggerDestinationStatus.active
      }
    });

    if (destinations.length !== d.input.destinations.length) {
      throw new ServiceError(
        badRequestError({
          code: 'invalid_destination',
          message: 'One or more trigger destinations were not found.'
        })
      );
    }

    let triggerActions = await this.core.resolveActionsForTriggers({
      slate,
      specificationOid: version.specification!.oid,
      triggers: d.input.triggers
    });

    let receiver = await db.slateTriggerReceiver.create({
      data: {
        ...getId('slateTriggerReceiver'),
        tenantOid: d.tenant.oid,
        slateOid: slate.oid,
        slateInstanceOid: slateInstance.oid,
        authConfigOid: authConfig?.oid ?? null,
        name: d.input.name,
        description: d.input.description,
        eventTypes: normalizeEventTypes(d.input.eventTypes)
      }
    });

    let receiverTriggers = await Promise.all(
      triggerActions.map(async trigger => {
        let pollIntervalSeconds: number | null = null;
        if (trigger.invocation.type === SlateTriggerReceiverTriggerSource.polling) {
          pollIntervalSeconds = trigger.invocation.intervalSeconds;
        }

        return await db.slateTriggerReceiverTrigger.create({
          data: {
            ...getId('slateTriggerReceiverTrigger'),
            receiverOid: receiver.oid,
            actionOid: trigger.action.oid,
            source: trigger.invocation.type,
            pollIntervalSeconds,
            nextPollAt: pollIntervalSeconds ? new Date() : null,
            state: trigger.state ?? null,
            registrationDetails: null
          },
          include: receiverTriggerInclude
        });
      })
    );

    await db.slateTriggerReceiverDestination.createMany({
      skipDuplicates: true,
      data: destinations.map(destination => ({
        oid: snowflake.nextId(),
        receiverOid: receiver.oid,
        destinationOid: destination.oid
      }))
    });

    await slateTriggerWebhookRegisterQueue.addManyWithOps(
      receiverTriggers.map(trigger => ({
        data: { receiverTriggerId: trigger.id },
        opts: { id: trigger.id }
      }))
    );

    return await this.getTriggerReceiverById({
      tenant: d.tenant,
      id: receiver.id
    });
  }

  async updateTriggerReceiver(d: {
    tenant: Tenant;
    receiverId: string;
    input: {
      authConfigId?: string | null;
      name?: string | null;
      description?: string | null;
      eventTypes?: string[];
      destinations?: string[];
      triggers?: { triggerId: string; state?: Record<string, any> | null }[];
    };
  }) {
    let receiver = await db.slateTriggerReceiver.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.receiverId
      },
      include: receiverInclude
    });
    if (!receiver) throw new ServiceError(notFoundError('slate.trigger.receiver'));

    let slate = receiver.slate;
    let version = await slateSessionService.getSessionVersion({
      slate,
      slateInstance: receiver.slateInstance
    });

    let authConfig = receiver.authConfig as SlateAuthConfig | null;
    if (d.input.authConfigId !== undefined) {
      authConfig = await this.core.resolveAuthConfig({
        tenant: d.tenant,
        slate,
        slateInstance: receiver.slateInstance,
        authConfigId: d.input.authConfigId ?? undefined,
        hasAuthMethods: (version.specification?.authMethods ?? []).length > 0
      });
    }

    await db.slateTriggerReceiver.update({
      where: { oid: receiver.oid },
      data: {
        authConfigOid:
          d.input.authConfigId !== undefined ? (authConfig?.oid ?? null) : undefined,
        name: d.input.name === null ? null : d.input.name,
        description: d.input.description === null ? null : d.input.description,
        eventTypes: d.input.eventTypes ? normalizeEventTypes(d.input.eventTypes) : undefined
      }
    });

    if (d.input.destinations) {
      let destinations = await db.slateTriggerDestination.findMany({
        where: {
          tenantOid: d.tenant.oid,
          id: { in: d.input.destinations },
          status: SlateTriggerDestinationStatus.active
        }
      });

      if (destinations.length !== d.input.destinations.length) {
        throw new ServiceError(
          badRequestError({
            code: 'invalid_destination',
            message: 'One or more trigger destinations were not found.'
          })
        );
      }

      let currentDestinationOids = new Set(
        receiver.destinations.map(dest => dest.destinationOid)
      );
      let incomingDestinationOids = new Set(destinations.map(dest => dest.oid));

      let destinationsToAdd = destinations.filter(
        dest => !currentDestinationOids.has(dest.oid)
      );
      let destinationsToRemove = receiver.destinations.filter(
        dest => !incomingDestinationOids.has(dest.destinationOid)
      );

      if (destinationsToAdd.length) {
        await db.slateTriggerReceiverDestination.createMany({
          skipDuplicates: true,
          data: destinationsToAdd.map(dest => ({
            oid: snowflake.nextId(),
            receiverOid: receiver.oid,
            destinationOid: dest.oid
          }))
        });
      }

      if (destinationsToRemove.length) {
        await db.slateTriggerReceiverDestination.deleteMany({
          where: {
            oid: { in: destinationsToRemove.map(dest => dest.oid) }
          }
        });
      }
    }

    if (d.input.triggers) {
      let triggerActions = await this.core.resolveActionsForTriggers({
        slate,
        specificationOid: version.specification!.oid,
        triggers: d.input.triggers
      });

      let existingByActionOid = new Map(
        receiver.triggers.map(trigger => [trigger.actionOid, trigger] as const)
      );
      let incomingByActionOid = new Map(
        triggerActions.map(trigger => [trigger.action.oid, trigger] as const)
      );

      let toRemove = receiver.triggers.filter(
        trigger => !incomingByActionOid.has(trigger.actionOid)
      );
      let toAdd = triggerActions.filter(
        trigger => !existingByActionOid.has(trigger.action.oid)
      );

      for (let trigger of toRemove) {
        try {
          await this.unregisterWebhookForReceiverTrigger({
            receiverTrigger: trigger
          });
        } catch (error) {
          console.error('Failed to auto-unregister trigger webhook:', error);
        }
      }

      if (toRemove.length) {
        await db.slateTriggerReceiverTrigger.deleteMany({
          where: {
            oid: { in: toRemove.map(trigger => trigger.oid) }
          }
        });
      }

      let createdTriggers = await Promise.all(
        toAdd.map(async trigger => {
          let pollIntervalSeconds: number | null = null;
          if (trigger.invocation.type === SlateTriggerReceiverTriggerSource.polling) {
            pollIntervalSeconds = trigger.invocation.intervalSeconds;
          }

          return await db.slateTriggerReceiverTrigger.create({
            data: {
              ...getId('slateTriggerReceiverTrigger'),
              receiverOid: receiver.oid,
              actionOid: trigger.action.oid,
              source: trigger.invocation.type,
              pollIntervalSeconds,
              nextPollAt: pollIntervalSeconds ? new Date() : null,
              state: trigger.state ?? null,
              registrationDetails: null
            },
            include: receiverTriggerInclude
          });
        })
      );

      await slateTriggerWebhookRegisterQueue.addManyWithOps(
        createdTriggers.map(trigger => ({
          data: { receiverTriggerId: trigger.id },
          opts: { id: trigger.id }
        }))
      );

      for (let trigger of receiver.triggers) {
        let incoming = incomingByActionOid.get(trigger.actionOid);
        if (incoming && incoming.state !== undefined) {
          await db.slateTriggerReceiverTrigger.update({
            where: { oid: trigger.oid },
            data: { state: incoming.state }
          });
        }
      }
    }

    return await this.getTriggerReceiverById({
      tenant: d.tenant,
      id: receiver.id
    });
  }

  async deleteTriggerReceiver(d: { tenant: Tenant; receiverId: string }) {
    let receiver = await db.slateTriggerReceiver.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.receiverId
      },
      include: receiverInclude
    });
    if (!receiver) throw new ServiceError(notFoundError('slate.trigger.receiver'));

    for (let trigger of receiver.triggers) {
      try {
        await this.unregisterWebhookForReceiverTrigger({
          receiverTrigger: trigger
        });
      } catch (error) {
        console.error('Failed to auto-unregister trigger webhook:', error);
      }
    }

    await db.slateTriggerReceiver.delete({
      where: { oid: receiver.oid }
    });

    return receiver;
  }

  async getTriggerReceiverById(d: { tenant: Tenant; id: string }) {
    let receiver = await db.slateTriggerReceiver.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.id
      },
      include: receiverInclude
    });
    if (!receiver) throw new ServiceError(notFoundError('slate.trigger.receiver'));
    return receiver;
  }

  async listTriggerReceivers(d: {
    tenant: Tenant;
    slateIds?: string[];
    slateInstanceIds?: string[];
  }) {
    let slateInstances = d.slateInstanceIds
      ? await db.slateInstance.findMany({
          where: {
            id: { in: d.slateInstanceIds },
            tenantOid: d.tenant.oid
          }
        })
      : undefined;

    let slates = d.slateIds
      ? await db.slate.findMany({
          where: {
            id: { in: d.slateIds }
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateTriggerReceiver.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant.oid,
              slateInstanceOid: slateInstances
                ? { in: slateInstances.map(instance => instance.oid) }
                : undefined,
              slateOid: slates ? { in: slates.map(slate => slate.oid) } : undefined
            },
            include: receiverInclude
          })
      )
    );
  }
}

export let slateTriggerReceiverService = Service.create(
  'slateTriggerReceiverService',
  () => new slateTriggerReceiverServiceImpl()
).build();
