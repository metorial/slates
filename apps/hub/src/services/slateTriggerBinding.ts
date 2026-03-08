import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import {
  SlateSharedTriggerConfigStatus,
  SlateTriggerReceiverStatus,
  SlateTriggerReceiverTriggerSource,
  type Tenant
} from '../../prisma/generated/client';
import { db } from '../db';
import { getId } from '../id';
import {
  slateTriggerWebhookRegisterQueue,
  slateTriggerWebhookUnregisterQueue
} from '../queues/trigger/eventQueues';
import { slateSessionService } from './slateSession';
import {
  MIN_POLL_INTERVAL_SECONDS,
  slateTriggerReceiverService
} from './slateTriggerReceiver';
import { getTriggerSpec, receiverTriggerInclude } from './slateTriggerReceiverShared';

let bindingInclude = {
  action: true,
  sharedConfigTrigger: true,
  receiver: {
    include: {
      slateInstance: true,
      authConfig: true,
      sharedConfig: true
    }
  }
};

class slateTriggerBindingServiceImpl {
  async processTriggerEventInput(
    d: Parameters<typeof slateTriggerReceiverService.processTriggerEventInput>[0]
  ) {
    return await slateTriggerReceiverService.processTriggerEventInput(d);
  }

  async sendTriggerEvent(d: Parameters<typeof slateTriggerReceiverService.sendTriggerEvent>[0]) {
    return await slateTriggerReceiverService.sendTriggerEvent(d);
  }

  async pollTriggerBinding(d: { triggerBindingId: string }) {
    return await slateTriggerReceiverService.pollTriggerReceiverTrigger({
      receiverTriggerId: d.triggerBindingId
    });
  }

  async handleTriggerWebhook(d: {
    triggerBindingId: string;
    request: Parameters<typeof slateTriggerReceiverService.handleTriggerWebhook>[0]['request'];
  }) {
    return await slateTriggerReceiverService.handleTriggerWebhook({
      receiverTriggerId: d.triggerBindingId,
      request: d.request
    });
  }

  async registerWebhookForTriggerBinding(d: { triggerBindingId: string }) {
    return await slateTriggerReceiverService.registerWebhookForReceiverTriggerId({
      receiverTriggerId: d.triggerBindingId
    });
  }

  async unregisterWebhookForTriggerBinding(d: { triggerBindingId: string }) {
    return await slateTriggerReceiverService.unregisterWebhookForReceiverTriggerId({
      receiverTriggerId: d.triggerBindingId
    });
  }

  async getTriggerBindingById(d: { tenant: Tenant; id: string }) {
    let binding = await db.slateTriggerReceiverTrigger.findFirst({
      where: {
        id: d.id,
        receiver: {
          tenantOid: d.tenant.oid,
          sharedConfigOid: { not: null }
        }
      },
      include: bindingInclude
    });
    if (!binding) throw new ServiceError(notFoundError('slate.trigger.binding'));
    return binding;
  }

  async listTriggerBindings(d: {
    tenant: Tenant;
    sharedTriggerConfigIds?: string[];
    sharedTriggerConfigTriggerIds?: string[];
    slateInstanceIds?: string[];
  }) {
    let sharedConfigs = d.sharedTriggerConfigIds?.length
      ? await db.slateSharedTriggerConfig.findMany({
          where: {
            tenantOid: d.tenant.oid,
            id: { in: d.sharedTriggerConfigIds }
          }
        })
      : undefined;
    let configTriggers = d.sharedTriggerConfigTriggerIds?.length
      ? await db.slateSharedTriggerConfigTrigger.findMany({
          where: {
            id: { in: d.sharedTriggerConfigTriggerIds },
            sharedConfig: { tenantOid: d.tenant.oid }
          }
        })
      : undefined;
    let slateInstances = d.slateInstanceIds?.length
      ? await db.slateInstance.findMany({
          where: {
            tenantOid: d.tenant.oid,
            id: { in: d.slateInstanceIds }
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(async opts =>
        db.slateTriggerReceiverTrigger.findMany({
          ...opts,
          where: {
            receiver: {
              tenantOid: d.tenant.oid,
              sharedConfigOid: sharedConfigs
                ? { in: sharedConfigs.map(config => config.oid) }
                : { not: null },
              slateInstanceOid: slateInstances
                ? { in: slateInstances.map(instance => instance.oid) }
                : undefined
            },
            sharedConfigTriggerOid: configTriggers
              ? { in: configTriggers.map(trigger => trigger.oid) }
              : undefined
          },
          include: bindingInclude
        })
      )
    );
  }

  async upsertTriggerBinding(d: {
    tenant: Tenant;
    input: {
      sharedTriggerConfigTriggerId: string;
      slateInstanceId: string;
      authConfigId?: string | null;
      externalKey: string;
    };
  }) {
    let configTrigger = await db.slateSharedTriggerConfigTrigger.findFirst({
      where: {
        id: d.input.sharedTriggerConfigTriggerId,
        sharedConfig: { tenantOid: d.tenant.oid }
      },
      include: {
        action: true,
        sharedConfig: true
      }
    });
    if (!configTrigger) {
      throw new ServiceError(notFoundError('slate.shared_trigger_config_trigger'));
    }

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
    if (!slateInstance) {
      throw new ServiceError(notFoundError('slate.instance', d.input.slateInstanceId));
    }
    if (!slateInstance.currentConfig) {
      throw new ServiceError(
        badRequestError({
          code: 'missing_instance_config',
          message: 'Provider instance does not have a current configuration set.'
        })
      );
    }
    if (slateInstance.slateOid !== configTrigger.sharedConfig.slateOid) {
      throw new ServiceError(
        badRequestError({
          code: 'invalid_slate_instance',
          message: 'Provider instance does not belong to the shared trigger config slate.'
        })
      );
    }

    let authConfig = d.input.authConfigId
      ? await db.slateAuthConfig.findFirst({
          where: {
            id: d.input.authConfigId,
            tenantOid: d.tenant.oid
          }
        })
      : null;

    let version = await slateSessionService.getSessionVersion({
      slate: slateInstance.slate,
      slateInstance
    });

    slateTriggerReceiverService.validateAuthConfig({
      tenant: d.tenant,
      slate: slateInstance.slate,
      slateInstance,
      authConfig,
      hasAuthMethods: (version.specification?.authMethods ?? []).length > 0
    });

    let spec = getTriggerSpec(configTrigger.action);
    let pollIntervalSeconds: number | null = null;
    if (spec.invocation.type === SlateTriggerReceiverTriggerSource.polling) {
      pollIntervalSeconds = Math.max(
        slateTriggerReceiverService.normalizePollIntervalOverride(
          configTrigger.pollIntervalSecondsOverride
        ) ?? spec.invocation.intervalSeconds,
        MIN_POLL_INTERVAL_SECONDS
      );
    }

    let existing = await db.slateTriggerReceiver.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        externalKey: d.input.externalKey
      },
      include: {
        triggers: true
      }
    });

    let result = await db.$transaction(async db => {
      let receiver = existing
        ? await db.slateTriggerReceiver.update({
            where: { oid: existing.oid },
            data: {
              slateOid: slateInstance.slateOid,
              slateInstanceOid: slateInstance.oid,
              authConfigOid: authConfig?.oid ?? null,
              sharedConfigOid: configTrigger.sharedConfigOid,
              status:
                configTrigger.sharedConfig.status === SlateSharedTriggerConfigStatus.active
                  ? SlateTriggerReceiverStatus.active
                  : SlateTriggerReceiverStatus.paused,
              name: configTrigger.sharedConfig.name,
              description: configTrigger.sharedConfig.description
            }
          })
        : await db.slateTriggerReceiver.create({
            data: {
              ...getId('slateTriggerReceiver'),
              tenantOid: d.tenant.oid,
              slateOid: slateInstance.slateOid,
              slateInstanceOid: slateInstance.oid,
              authConfigOid: authConfig?.oid ?? null,
              sharedConfigOid: configTrigger.sharedConfigOid,
              status:
                configTrigger.sharedConfig.status === SlateSharedTriggerConfigStatus.active
                  ? SlateTriggerReceiverStatus.active
                  : SlateTriggerReceiverStatus.paused,
              name: configTrigger.sharedConfig.name,
              description: configTrigger.sharedConfig.description,
              eventTypes: [],
              externalKey: d.input.externalKey
            }
          });

      let existingTrigger = existing?.triggers[0];
      let trigger = existingTrigger
        ? await db.slateTriggerReceiverTrigger.update({
            where: { oid: existingTrigger.oid },
            data: {
              actionOid: configTrigger.actionOid,
              sharedConfigTriggerOid: configTrigger.oid,
              source: spec.invocation.type,
              pollIntervalSeconds,
              nextPollAt:
                spec.invocation.type === SlateTriggerReceiverTriggerSource.polling &&
                !existingTrigger.nextPollAt
                  ? new Date()
                  : existingTrigger.nextPollAt
            },
            include: receiverTriggerInclude
          })
        : await db.slateTriggerReceiverTrigger.create({
            data: {
              ...getId('slateTriggerReceiverTrigger'),
              receiverOid: receiver.oid,
              actionOid: configTrigger.actionOid,
              sharedConfigTriggerOid: configTrigger.oid,
              source: spec.invocation.type,
              pollIntervalSeconds,
              nextPollAt: pollIntervalSeconds ? new Date() : null,
              state: null,
              registrationDetails: null
            },
            include: receiverTriggerInclude
          });

      return trigger;
    });

    if (result.source === SlateTriggerReceiverTriggerSource.polling && pollIntervalSeconds != null) {
      result = await db.slateTriggerReceiverTrigger.update({
        where: { oid: result.oid },
        data: {
          pollIntervalSeconds,
          nextPollAt: result.nextPollAt ?? new Date()
        },
        include: receiverTriggerInclude
      });
    }

    if (
      result.source === SlateTriggerReceiverTriggerSource.webhook &&
      !result.registrationDetails
    ) {
      await slateTriggerWebhookRegisterQueue.add(
        { receiverTriggerId: result.id },
        { id: result.id }
      );
    }

    return await this.getTriggerBindingById({
      tenant: d.tenant,
      id: result.id
    });
  }

  async deleteTriggerBinding(d: { tenant: Tenant; triggerBindingId: string }) {
    let binding = await this.getTriggerBindingById({
      tenant: d.tenant,
      id: d.triggerBindingId
    });

    if (binding.source === SlateTriggerReceiverTriggerSource.webhook) {
      await slateTriggerWebhookUnregisterQueue.add(
        { receiverTriggerId: binding.id },
        { id: binding.id }
      );
    }

    await db.slateTriggerReceiver.delete({
      where: { oid: binding.receiverOid }
    });

    return binding;
  }
}

export let slateTriggerBindingService = Service.create(
  'slateTriggerBindingService',
  () => new slateTriggerBindingServiceImpl()
).build();
