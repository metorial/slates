import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type {
  Slate,
  SlateAction,
  SlateAuthConfig,
  SlateInstance,
  SlateInstanceConfig,
  SlateTriggerDestination,
  SlateTriggerReceiver,
  SlateTriggerReceiverDestination,
  SlateTriggerReceiverTrigger,
  Tenant
} from '../../prisma/generated/client';
import { db } from '../db';
import { getId, snowflake } from '../id';
import {
  getTriggerWebhookBaseUrl,
  type TriggerWebhookRequestLog,
  type TriggerWebhookRequestPayload
} from '../lib/triggerWebhook';
import {
  slateTriggerEventProcessQueue,
  slateTriggerEventSendQueue,
  slateTriggerWebhookRegisterQueue
} from '../queues/trigger/eventQueues';
import { getTenantAndSenderForSignal, signal } from '../signal';
import { slateAuthHandlerService } from './slateInstanceAuthHandler';
import { slateInvocationService } from './slateInvocation';
import { slateSessionService } from './slateSession';

const normalizeEventTypes = (eventTypes?: string[] | null) =>
  eventTypes && eventTypes.length > 0 ? eventTypes : [];

type TriggerInvocationSpec =
  | {
      type: 'polling';
      intervalSeconds: number;
    }
  | {
      type: 'webhook';
      autoRegistration: boolean;
      autoUnregistration: boolean;
    };

type TriggerActionSpec = {
  type: 'action.trigger';
  invocation: TriggerInvocationSpec;
};

type ReceiverTriggerWithRelations = SlateTriggerReceiverTrigger & {
  action: SlateAction;
  receiver: SlateTriggerReceiver & {
    tenant: Tenant;
    slate: Slate;
    slateInstance: SlateInstance & {
      currentConfig: SlateInstanceConfig | null;
    };
    destinations: (SlateTriggerReceiverDestination & {
      destination: SlateTriggerDestination;
    })[];
  };
};

const receiverInclude = {
  tenant: true,
  slate: true,
  slateInstance: {
    include: {
      currentConfig: true
    }
  },
  destinations: {
    include: {
      destination: true
    }
  },
  triggers: {
    include: {
      action: true
    }
  },
  authConfig: true
};

const receiverTriggerInclude = {
  action: true,
  receiver: {
    include: receiverInclude
  }
};

const getTriggerSpec = (action: SlateAction): TriggerActionSpec => {
  let spec = action.spec as TriggerActionSpec;
  if (!spec || spec.type !== 'action.trigger' || !spec.invocation) {
    throw new ServiceError(
      badRequestError({
        code: 'invalid_trigger_action',
        message: `Action ${action.id} is not a trigger.`
      })
    );
  }

  return spec;
};

const buildInvocationAuth = (auth: {
  output?: Record<string, any> | null;
  input?: Record<string, any> | null;
  authMethod: { key: string };
}) => ({
  authenticationMethodId: auth.authMethod.key,
  data: auth.output ?? auth.input ?? {}
});

class slateTriggerReceiverServiceImpl {
  private async getReceiverTriggerWithRelations(id: string) {
    let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
      where: { id },
      include: receiverTriggerInclude
    });
    if (!receiverTrigger) throw new ServiceError(notFoundError('slate.trigger.receiver_trigger'));
    return receiverTrigger as ReceiverTriggerWithRelations;
  }

  private async resolveAuthConfig(d: {
    tenant: Tenant;
    slate: Slate;
    slateInstance: SlateInstance;
    authConfigId?: string;
    hasAuthMethods: boolean;
  }) {
    if (!d.hasAuthMethods && d.authConfigId) {
      throw new ServiceError(
        badRequestError({
          code: 'authentication_not_supported',
          message: 'Provider does not have any authentication methods configured.'
        })
      );
    }

    if (d.hasAuthMethods && !d.authConfigId) {
      throw new ServiceError(
        badRequestError({
          code: 'authentication_required',
          message: 'Authentication method is required for this provider.'
        })
      );
    }

    if (!d.authConfigId) return null;

    let authConfig = await db.slateAuthConfig.findFirst({
      where: {
        id: d.authConfigId,
        tenantOid: d.tenant.oid,
        slateOid: d.slate.oid
      },
      include: {
        authMethod: true
      }
    });
    if (!authConfig) {
      throw new ServiceError(notFoundError('slate.auth_config'));
    }

    if (authConfig.instanceOid && authConfig.instanceOid !== d.slateInstance.oid) {
      throw new ServiceError(
        badRequestError({
          message: 'This authentication configuration is not valid for the selected provider.'
        })
      );
    }

    return authConfig;
  }

  private async resolveActionsForTriggers(d: {
    slate: Slate;
    specificationOid: bigint;
    triggers: { triggerId: string; state?: Record<string, any> | null }[];
  }) {
    let triggerIds = d.triggers.map(t => t.triggerId);

    let actions = await db.slateAction.findMany({
      where: {
        type: 'trigger',
        slateOid: d.slate.oid,
        slateSpecifications: {
          some: {
            specificationOid: d.specificationOid
          }
        },
        OR: [
          { id: { in: triggerIds } },
          { key: { in: triggerIds } },
          { identifier: { in: triggerIds } }
        ]
      }
    });

    let actionById = new Map(actions.map(action => [action.id, action] as const));
    let actionByKey = new Map(actions.map(action => [action.key, action] as const));
    let actionByIdentifier = new Map(actions.map(action => [action.identifier, action] as const));

    let seenActionIds = new Set<string>();

    return d.triggers.map(trigger => {
      let action =
        actionById.get(trigger.triggerId) ||
        actionByKey.get(trigger.triggerId) ||
        actionByIdentifier.get(trigger.triggerId);

      if (!action) {
        throw new ServiceError(
          badRequestError({
            code: 'invalid_trigger_action',
            message: `Trigger action not found: ${trigger.triggerId}`
          })
        );
      }

      let spec = getTriggerSpec(action);
      if (seenActionIds.has(action.id)) {
        throw new ServiceError(
          badRequestError({
            code: 'duplicate_trigger_action',
            message: `Trigger action specified multiple times: ${action.id}`
          })
        );
      }

      seenActionIds.add(action.id);

      return {
        action,
        state: trigger.state ?? null,
        invocation: spec.invocation
      };
    });
  }

  private async getInvocationContext(d: { receiverTrigger: ReceiverTriggerWithRelations }) {
    let { receiver, action } = d.receiverTrigger;

    if (!receiver.slateInstance.currentConfig) {
      throw new ServiceError(
        badRequestError({
          message: 'Provider instance does not have a current configuration set.'
        })
      );
    }

    let version = await slateSessionService.getSessionVersion({
      slate: receiver.slate,
      slateInstance: receiver.slateInstance
    });

    let auth = null as
      | {
          authenticationMethodId: string;
          data: Record<string, any>;
        }
      | null;

    let hasAuthMethods = (version.specification?.authMethods ?? []).length > 0;
    if (hasAuthMethods) {
      if (!receiver.authConfigOid) {
        throw new ServiceError(
          badRequestError({
            code: 'authentication_required',
            message: 'Authentication method is required for this provider.'
          })
        );
      }

      let authRes = await slateAuthHandlerService.getSlateInstanceAuth({
        tenant: receiver.tenant,
        slateInstance: receiver.slateInstance,
        authConfigId: receiver.authConfigOid,
        minExpirationBuffer: 30 * 1000
      });

      auth = buildInvocationAuth(authRes);
    }

    return {
      version,
      config: receiver.slateInstance.currentConfig.value ?? {},
      auth,
      action
    };
  }

  private async createInvocationStack(d: {
    receiver: ReceiverTriggerWithRelations['receiver'];
    receiverTrigger: ReceiverTriggerWithRelations;
    version: Awaited<ReturnType<typeof slateSessionService.getSessionVersion>>;
    config: Record<string, any>;
    auth: { authenticationMethodId: string; data: Record<string, any> } | null;
  }) {
    return await slateInvocationService.createInvocationWithState({
      participants: [],
      slateVersion: d.version,
      config: d.config,
      session: { id: d.receiver.id, state: d.receiverTrigger.state ?? {} },
      auth: d.auth
    });
  }

  private async recordTriggerInvocation(d: {
    receiver: ReceiverTriggerWithRelations['receiver'];
    receiverTrigger?: ReceiverTriggerWithRelations;
    eventOid?: bigint;
    type:
      | 'poll'
      | 'webhook_handle'
      | 'map_event'
      | 'webhook_register'
      | 'webhook_unregister';
    invocation: { oid: bigint };
  }) {
    await db.slateTriggerInvocation.create({
      data: {
        ...getId('slateTriggerInvocation'),
        type: d.type,
        receiverOid: d.receiver.oid,
        receiverTriggerOid: d.receiverTrigger?.oid,
        eventOid: d.eventOid,
        invocationOid: d.invocation.oid
      }
    });
  }

  private async enqueueTriggerEventInputs(d: {
    receiverTrigger: ReceiverTriggerWithRelations;
    inputs: Record<string, any>[];
    request?: TriggerWebhookRequestLog | TriggerWebhookRequestPayload | null;
  }) {
    if (d.inputs.length === 0) return;

    let rows = d.inputs.map(input => ({
      ...getId('slateTriggerEventInput'),
      receiverOid: d.receiverTrigger.receiver.oid,
      receiverTriggerOid: d.receiverTrigger.oid,
      actionOid: d.receiverTrigger.actionOid,
      slateOid: d.receiverTrigger.receiver.slate.oid,
      slateInstanceOid: d.receiverTrigger.receiver.slateInstance.oid,
      input,
      request: d.request ?? null
    }));

    await db.slateTriggerEventInput.createMany({
      data: rows
    });

    await slateTriggerEventProcessQueue.addManyWithOps(
      rows.map(row => ({
        data: { eventInputId: row.id },
        opts: { id: row.id }
      }))
    );
  }

  private resolveTriggerDestinations(d: {
    receiver: ReceiverTriggerWithRelations['receiver'];
    eventType: string;
  }) {
    let destinations = d.receiver.destinations
      .map(r => r.destination)
      .filter(dest => dest.status === 'active');
    let shouldDeliver = destinations.length > 0;

    if (d.receiver.eventTypes.length && !d.receiver.eventTypes.includes(d.eventType)) {
      shouldDeliver = false;
    }

    return {
      destinations,
      shouldDeliver,
      signalDestinationIds: shouldDeliver
        ? destinations.map(dest => dest.signalDestinationId)
        : []
    };
  }

  private async createSignalEvent(d: {
    receiver: ReceiverTriggerWithRelations['receiver'];
    action: SlateAction;
    event: {
      id: string;
      type: string;
      sourceId: string;
      output: Record<string, any>;
      createdAt: Date;
    };
    signalDestinationIds: string[];
  }) {
    let { sender, tenant: signalTenant } = await getTenantAndSenderForSignal(d.receiver.tenant);

    let payload = {
      object: 'slate.trigger.event',

      id: d.event.id,
      type: d.event.type,
      sourceId: d.event.sourceId,

      slateId: d.receiver.slate.id,
      slateInstanceId: d.receiver.slateInstance.id,
      triggerReceiverId: d.receiver.id,
      triggerId: d.action.id,
      triggerKey: d.action.key,

      data: d.event.output,

      createdAt: d.event.createdAt
    };

    let signalEvent = await signal.event.create({
      tenantId: signalTenant.id,
      senderId: sender.id,
      topics: [
        `slate:${d.receiver.slate.id}`,
        `slate_instance:${d.receiver.slateInstance.id}`,
        `trigger:${d.action.key}`,
        `trigger_receiver:${d.receiver.id}`
      ],
      eventType: d.event.type,
      payloadJson: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
        'x-slates-trigger-event-id': d.event.id,
        'x-slates-trigger-event-type': d.event.type,
        'x-slates-slate-id': d.receiver.slate.id,
        'x-slates-slate-instance-id': d.receiver.slateInstance.id,
        'x-slates-trigger-receiver-id': d.receiver.id,
        'x-slates-trigger-id': d.action.id
      },
      onlyForDestinations: d.signalDestinationIds
    });

    return signalEvent.id;
  }

  private async dispatchTriggerEvent(d: {
    receiverTrigger: ReceiverTriggerWithRelations;
    action: SlateAction;
    event: {
      oid: bigint;
      id: string;
      type: string;
      sourceId: string;
      output: Record<string, any>;
      createdAt: Date;
      signalEventId: string;
    };
  }) {
    let receiver = d.receiverTrigger.receiver;
    let targets = this.resolveTriggerDestinations({
      receiver,
      eventType: d.event.type
    });

    if (!targets.shouldDeliver) {
      await db.slateTriggerEvent.update({
        where: { oid: d.event.oid },
        data: { deliveryStatus: 'skipped' }
      });
      return;
    }

    let signalEventId = d.event.signalEventId;

    if (!signalEventId) {
      signalEventId = await this.createSignalEvent({
        receiver,
        action: d.action,
        event: {
          id: d.event.id,
          type: d.event.type,
          sourceId: d.event.sourceId,
          output: d.event.output,
          createdAt: d.event.createdAt
        },
        signalDestinationIds: targets.signalDestinationIds
      });

      await db.slateTriggerEvent.update({
        where: { oid: d.event.oid },
        data: {
          signalEventId: signalEventId
        }
      });
    }

    await db.slateTriggerDelivery.createMany({
      data: targets.destinations.map(dest => ({
        ...getId('slateTriggerDelivery'),
        eventOid: d.event.oid,
        destinationOid: dest.oid,
        signalEventId
      })),
      skipDuplicates: true
    });

    await db.slateTriggerEvent.update({
      where: { oid: d.event.oid },
      data: {
        deliveryStatus: 'sent'
      }
    });
  }

  async processTriggerEventInput(d: { eventInputId: string }) {
    let eventInput = await db.slateTriggerEventInput.findFirst({
      where: { id: d.eventInputId },
      include: {
        receiverTrigger: {
          include: receiverTriggerInclude
        }
      }
    });
    if (!eventInput) throw new ServiceError(notFoundError('slate.trigger.event_input'));

    if (!['pending', 'retrying'].includes(eventInput.status)) return;
    if (eventInput.receiverTrigger.receiver.status !== 'active') {
      await db.slateTriggerEventInput.update({
        where: { oid: eventInput.oid },
        data: { status: 'skipped' }
      });
      return;
    }

    let attemptCount = eventInput.attemptCount + 1;
    await db.slateTriggerEventInput.update({
      where: { oid: eventInput.oid },
      data: {
        status: 'processing',
        attemptCount,
        errorCode: null,
        errorMessage: null
      }
    });

    try {
      let context = await this.getInvocationContext({
        receiverTrigger: eventInput.receiverTrigger as ReceiverTriggerWithRelations
      });

      let stack = await this.createInvocationStack({
        receiver: eventInput.receiverTrigger.receiver,
        receiverTrigger: eventInput.receiverTrigger as ReceiverTriggerWithRelations,
        version: context.version,
        config: context.config,
        auth: context.auth
      });

      let mapRes = await slateInvocationService.invokeTriggerMapper({
        stack,
        actionId: context.action.key,
        input: eventInput.input as Record<string, any>
      });

      if (mapRes.status === 'error') {
        await this.recordTriggerInvocation({
          receiver: eventInput.receiverTrigger.receiver,
          receiverTrigger: eventInput.receiverTrigger as ReceiverTriggerWithRelations,
          type: 'map_event',
          invocation: mapRes.invocation
        });

        let status = attemptCount >= 5 ? 'failed' : 'retrying';
        await db.slateTriggerEventInput.update({
          where: { oid: eventInput.oid },
          data: {
            status,
            errorCode: mapRes.error.code,
            errorMessage: mapRes.error.message
          }
        });

        if (status === 'retrying') {
          await slateTriggerEventProcessQueue.add(
            { eventInputId: eventInput.id },
            { delay: Math.min(30_000, 1000 * 2 ** attemptCount) }
          );
        }

        return;
      }

      let existing = await db.slateTriggerEvent.findFirst({
        where: {
          receiverTriggerOid: eventInput.receiverTrigger.oid,
          sourceId: mapRes.data.id
        }
      });

      if (existing) {
        if (existing.deliveryStatus === 'pending') {
          await slateTriggerEventSendQueue.add(
            { eventId: existing.id },
            { id: existing.id }
          );
        }

        await this.recordTriggerInvocation({
          receiver: eventInput.receiverTrigger.receiver,
          receiverTrigger: eventInput.receiverTrigger as ReceiverTriggerWithRelations,
          eventOid: existing.oid,
          type: 'map_event',
          invocation: mapRes.invocation
        });

        await db.slateTriggerEventInput.update({
          where: { oid: eventInput.oid },
          data: {
            status: 'skipped',
            eventOid: existing.oid
          }
        });

        return;
      }

      let createdAt = new Date();
      let eventRecord = getId('slateTriggerEvent');
      let receiver = eventInput.receiverTrigger.receiver;
      let targets = this.resolveTriggerDestinations({
        receiver,
        eventType: mapRes.data.type
      });

      let signalEventId = await this.createSignalEvent({
        receiver,
        action: context.action,
        event: {
          id: eventRecord.id,
          type: mapRes.data.type,
          sourceId: mapRes.data.id,
          output: mapRes.data.output,
          createdAt
        },
        signalDestinationIds: targets.signalDestinationIds
      });

      let event = await db.slateTriggerEvent.create({
        data: {
          ...eventRecord,
          receiverOid: receiver.oid,
          receiverTriggerOid: eventInput.receiverTrigger.oid,
          actionOid: eventInput.receiverTrigger.actionOid,
          slateOid: receiver.slate.oid,
          slateInstanceOid: receiver.slateInstance.oid,
          type: mapRes.data.type,
          sourceId: mapRes.data.id,
          input: eventInput.input,
          output: mapRes.data.output,
          deliveryStatus: targets.shouldDeliver ? 'pending' : 'skipped',
          signalEventId,
          invocationOid: mapRes.invocation.oid,
          createdAt
        }
      });

      await this.recordTriggerInvocation({
        receiver: eventInput.receiverTrigger.receiver,
        receiverTrigger: eventInput.receiverTrigger as ReceiverTriggerWithRelations,
        eventOid: event.oid,
        type: 'map_event',
        invocation: mapRes.invocation
      });

      await db.slateTriggerEventInput.update({
        where: { oid: eventInput.oid },
        data: {
          status: 'succeeded',
          eventOid: event.oid
        }
      });

      if (targets.shouldDeliver) {
        await slateTriggerEventSendQueue.add(
          { eventId: event.id },
          { id: event.id }
        );
      }
    } catch (error) {
      let status = attemptCount >= 5 ? 'failed' : 'retrying';
      let errorMessage =
        error instanceof Error ? error.message : 'Unexpected error while processing trigger';
      let errorCode = 'unexpected_error';
      if (typeof error === 'object' && error && 'code' in error) {
        let possibleCode = (error as { code?: string }).code;
        if (typeof possibleCode === 'string') {
          errorCode = possibleCode;
        }
      }

      await db.slateTriggerEventInput.update({
        where: { oid: eventInput.oid },
        data: {
          status,
          errorCode,
          errorMessage
        }
      });

      if (status === 'retrying') {
        await slateTriggerEventProcessQueue.add(
          { eventInputId: eventInput.id },
          { delay: Math.min(30_000, 1000 * 2 ** attemptCount) }
        );
      }
    }
  }

  async sendTriggerEvent(d: { eventId: string }) {
    let event = await db.slateTriggerEvent.findFirst({
      where: { id: d.eventId },
      include: {
        action: true,
        receiverTrigger: {
          include: receiverTriggerInclude
        }
      }
    });
    if (!event) throw new ServiceError(notFoundError('slate.trigger.event'));

    if (event.deliveryStatus !== 'pending') return;
    if (event.receiverTrigger.receiver.status !== 'active') {
      await db.slateTriggerEvent.update({
        where: { oid: event.oid },
        data: { deliveryStatus: 'skipped' }
      });
      return;
    }

    await this.dispatchTriggerEvent({
      receiverTrigger: event.receiverTrigger as ReceiverTriggerWithRelations,
      action: event.action,
      event: {
        oid: event.oid,
        id: event.id,
        type: event.type,
        sourceId: event.sourceId,
        output: event.output as Record<string, any>,
        createdAt: event.createdAt,
        signalEventId: event.signalEventId
      }
    });
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

    let authConfig = await this.resolveAuthConfig({
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
        status: 'active'
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

    let triggerActions = await this.resolveActionsForTriggers({
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
        let isPolling = trigger.invocation.type === 'polling';
        let pollIntervalSeconds = isPolling ? trigger.invocation.intervalSeconds : null;

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
      authConfig = await this.resolveAuthConfig({
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
        authConfigOid: d.input.authConfigId !== undefined ? authConfig?.oid ?? null : undefined,
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
          status: 'active'
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

      let destinationsToAdd = destinations.filter(dest => !currentDestinationOids.has(dest.oid));
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
      let triggerActions = await this.resolveActionsForTriggers({
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
          let isPolling = trigger.invocation.type === 'polling';
          let pollIntervalSeconds = isPolling ? trigger.invocation.intervalSeconds : null;

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

  async listTriggerReceivers(d: { tenant: Tenant; slateIds?: string[]; slateInstanceIds?: string[] }) {
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

  async registerWebhookForReceiverTrigger(d: {
    receiverTrigger: ReceiverTriggerWithRelations | SlateTriggerReceiverTrigger;
  }) {
    let receiverTrigger =
      'receiver' in d.receiverTrigger
        ? (d.receiverTrigger as ReceiverTriggerWithRelations)
        : await this.getReceiverTriggerWithRelations(d.receiverTrigger.id);

    let spec = getTriggerSpec(receiverTrigger.action);

    if (spec.invocation.type !== 'webhook' || !spec.invocation.autoRegistration) {
      return;
    }

    let context = await this.getInvocationContext({ receiverTrigger });

    let stack = await this.createInvocationStack({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      version: context.version,
      config: context.config,
      auth: context.auth
    });

    let res = await slateInvocationService.registerWebhook({
      stack,
      actionId: context.action.key,
      webhookBaseUrl: getTriggerWebhookBaseUrl(receiverTrigger.id)
    });

    await this.recordTriggerInvocation({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      type: 'webhook_register',
      invocation: res.invocation
    });

    if (res.status === 'error') {
      return;
    }

    await db.slateTriggerReceiverTrigger.update({
      where: { oid: receiverTrigger.oid },
      data: {
        registrationDetails: res.data.registrationDetails ?? null,
        state: res.data.state ?? receiverTrigger.state
      }
    });
  }

  async registerWebhookForReceiverTriggerId(d: { receiverTriggerId: string }) {
    let receiverTrigger = await this.getReceiverTriggerWithRelations(d.receiverTriggerId);
    await this.registerWebhookForReceiverTrigger({ receiverTrigger });
  }

  async unregisterWebhookForReceiverTrigger(d: {
    receiverTrigger: ReceiverTriggerWithRelations | SlateTriggerReceiverTrigger;
  }) {
    let receiverTrigger =
      'receiver' in d.receiverTrigger
        ? (d.receiverTrigger as ReceiverTriggerWithRelations)
        : await this.getReceiverTriggerWithRelations(d.receiverTrigger.id);

    let spec = getTriggerSpec(receiverTrigger.action);

    if (spec.invocation.type !== 'webhook' || !spec.invocation.autoUnregistration) {
      return;
    }

    if (!receiverTrigger.registrationDetails) return;

    let context = await this.getInvocationContext({ receiverTrigger });

    let stack = await this.createInvocationStack({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      version: context.version,
      config: context.config,
      auth: context.auth
    });

    let res = await slateInvocationService.unregisterWebhook({
      stack,
      actionId: context.action.key,
      webhookBaseUrl: getTriggerWebhookBaseUrl(receiverTrigger.id),
      registrationDetails: receiverTrigger.registrationDetails,
      state: receiverTrigger.state
    });

    await this.recordTriggerInvocation({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      type: 'webhook_unregister',
      invocation: res.invocation
    });

    if (res.status === 'error') {
      return;
    }

    await db.slateTriggerReceiverTrigger.update({
      where: { oid: receiverTrigger.oid },
      data: {
        registrationDetails: null
      }
    });
  }

  async unregisterWebhookForReceiverTriggerId(d: { receiverTriggerId: string }) {
    let receiverTrigger = await this.getReceiverTriggerWithRelations(d.receiverTriggerId);
    await this.unregisterWebhookForReceiverTrigger({ receiverTrigger });
  }

  async pollTriggerReceiverTrigger(d: { receiverTriggerId: string }) {
    let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
      where: {
        id: d.receiverTriggerId
      },
      include: receiverTriggerInclude
    });
    if (!receiverTrigger) throw new ServiceError(notFoundError('slate.trigger.receiver_trigger'));

    if (receiverTrigger.source !== 'polling') return;
    if (receiverTrigger.receiver.status !== 'active') return;

    let context = await this.getInvocationContext({ receiverTrigger });

    let stack = await this.createInvocationStack({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      version: context.version,
      config: context.config,
      auth: context.auth
    });

    let pollRes = await slateInvocationService.pollTriggerForEvents({
      stack,
      actionId: context.action.key,
      state: receiverTrigger.state
    });

    await this.recordTriggerInvocation({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      type: 'poll',
      invocation: pollRes.invocation
    });

    let now = new Date();
    let nextPollAt = receiverTrigger.pollIntervalSeconds
      ? new Date(now.getTime() + receiverTrigger.pollIntervalSeconds * 1000)
      : null;

    if (pollRes.status === 'error') {
      await db.slateTriggerReceiverTrigger.update({
        where: { oid: receiverTrigger.oid },
        data: {
          lastPolledAt: now,
          nextPollAt
        }
      });
      return;
    }

    await db.slateTriggerReceiverTrigger.update({
      where: { oid: receiverTrigger.oid },
      data: {
        state:
          pollRes.data.updatedState !== undefined
            ? pollRes.data.updatedState
            : receiverTrigger.state,
        lastPolledAt: now,
        nextPollAt
      }
    });

    await this.enqueueTriggerEventInputs({
      receiverTrigger,
      inputs: pollRes.data.inputs
    });
  }

  async handleTriggerWebhook(d: {
    receiverTriggerId: string;
    request: TriggerWebhookRequestPayload;
    requestLog?: TriggerWebhookRequestLog | null;
  }) {
    let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
      where: {
        id: d.receiverTriggerId
      },
      include: receiverTriggerInclude
    });
    if (!receiverTrigger) throw new ServiceError(notFoundError('slate.trigger.receiver_trigger'));

    if (receiverTrigger.source !== 'webhook') return;
    if (receiverTrigger.receiver.status !== 'active') return;

    let context = await this.getInvocationContext({ receiverTrigger });

    let stack = await this.createInvocationStack({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      version: context.version,
      config: context.config,
      auth: context.auth
    });

    let res = await slateInvocationService.handleWebhookRequest({
      stack,
      actionId: context.action.key,
      url: d.request.url,
      method: d.request.method,
      headers: d.request.headers,
      body: d.request.body ?? null,
      state: receiverTrigger.state
    });

    await this.recordTriggerInvocation({
      receiver: receiverTrigger.receiver,
      receiverTrigger,
      type: 'webhook_handle',
      invocation: res.invocation
    });

    if (res.status === 'error') {
      return;
    }

    await db.slateTriggerReceiverTrigger.update({
      where: { oid: receiverTrigger.oid },
      data: {
        state:
          res.data.updatedState !== undefined ? res.data.updatedState : receiverTrigger.state
      }
    });

    await this.enqueueTriggerEventInputs({
      receiverTrigger,
      inputs: res.data.inputs,
      request: d.requestLog ?? d.request
    });
  }
}

export let slateTriggerReceiverService = Service.create(
  'slateTriggerReceiverService',
  () => new slateTriggerReceiverServiceImpl()
).build();
