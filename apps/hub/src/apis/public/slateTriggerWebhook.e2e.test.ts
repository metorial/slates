import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Tenant } from '../../../prisma/generated/client';
import { SlateStatus } from '../../../prisma/generated/client';
import { cleanDatabase, testDb } from '../../test/setup';
import { fixtures } from '../../test/fixtures';

const signalState = vi.hoisted(() => {
  let seq = 0;
  return {
    nextId: (prefix: string) => `${prefix}_${++seq}`,
    tenants: new Map<string, { id: string; identifier: string; name: string }>(),
    senders: new Map<string, { id: string; identifier: string; name: string }>(),
    destinations: [] as Array<{
      id: string;
      tenantId: string;
      senderId: string;
      name: string;
      description?: string | null;
      eventTypes: string[] | null;
      webhook: { url: string; method: string };
    }>,
    events: [] as Array<{
      id: string;
      tenantId: string;
      senderId: string;
      topics: string[];
      eventType: string;
      payloadJson: string;
      headers: Record<string, string>;
      onlyForDestinations?: string[];
    }>
  };
});

const queueMocks = vi.hoisted(() => ({
  processAddMany: vi.fn(),
  processAdd: vi.fn(),
  sendAdd: vi.fn(),
  registerAddMany: vi.fn(),
  webhookAdd: vi.fn()
}));

const invocationMocks = vi.hoisted(() => ({
  handleWebhookRequest: vi.fn(),
  invokeTriggerMapper: vi.fn(),
  registerWebhook: vi.fn(),
  unregisterWebhook: vi.fn()
}));

vi.mock('../../queues/trigger/eventQueues', () => ({
  slateTriggerEventProcessQueue: {
    addManyWithOps: queueMocks.processAddMany,
    add: queueMocks.processAdd
  },
  slateTriggerEventSendQueue: {
    add: queueMocks.sendAdd
  },
  slateTriggerWebhookRegisterQueue: {
    addManyWithOps: queueMocks.registerAddMany
  },
  slateTriggerWebhookUnregisterQueue: {
    addManyWithOps: vi.fn()
  }
}));

vi.mock('../../queues/trigger/webhook', () => ({
  slateTriggerWebhookQueue: {
    add: queueMocks.webhookAdd
  }
}));

vi.mock('../../services/slateInvocation', () => ({
  slateInvocationService: {
    createInvocationWithState: vi.fn(async () => ({ invoke: vi.fn() })),
    handleWebhookRequest: invocationMocks.handleWebhookRequest,
    invokeTriggerMapper: invocationMocks.invokeTriggerMapper,
    registerWebhook: invocationMocks.registerWebhook,
    unregisterWebhook: invocationMocks.unregisterWebhook
  }
}));

vi.mock('../../registry', () => ({
  getRegistryClient: vi.fn(async () => {
    throw new Error('Registry client not available in trigger webhook tests');
  })
}));

vi.mock('../../functionBay', () => ({
  functionBay: {
    tenant: {
      upsert: vi.fn(async () => ({ id: 'fb-tenant' }))
    },
    function: {
      invoke: vi.fn(async () => ({ type: 'error', error: { message: 'mocked' } }))
    },
    functionInvocation: {
      get: vi.fn(async () => null)
    }
  },
  functionBayTenant: { id: 'fb-tenant' },
  functionBayProvider: { oid: BigInt(1) }
}));

vi.mock('../../signal', async () => {
  const { db } = await import('../../db');

  const ensureSender = async () => {
    let existing = signalState.senders.get('slates-trigger-sender');
    if (existing) return existing;

    let sender = {
      id: signalState.nextId('sender'),
      identifier: 'slates-trigger-sender',
      name: 'Slates Triggers'
    };
    signalState.senders.set(sender.identifier, sender);
    return sender;
  };

  const ensureTenant = async (tenant: Tenant) => {
    let existing = signalState.tenants.get(tenant.identifier);
    if (existing) return existing;

    let signalTenant = {
      id: signalState.nextId('tenant'),
      identifier: tenant.identifier,
      name: tenant.name
    };
    signalState.tenants.set(signalTenant.identifier, signalTenant);

    await db.tenant.update({
      where: { oid: tenant.oid },
      data: { signalTenantId: signalTenant.id }
    });

    return signalTenant;
  };

  return {
    signal: {
      tenant: {
        upsert: async (input: { name: string; identifier: string }) => {
          let existing = signalState.tenants.get(input.identifier);
          if (existing) {
            existing.name = input.name;
            return existing;
          }
          let created = {
            id: signalState.nextId('tenant'),
            identifier: input.identifier,
            name: input.name
          };
          signalState.tenants.set(created.identifier, created);
          return created;
        }
      },
      sender: {
        upsert: async (input: { name: string; identifier: string }) => {
          let existing = signalState.senders.get(input.identifier);
          if (existing) {
            existing.name = input.name;
            return existing;
          }
          let created = {
            id: signalState.nextId('sender'),
            identifier: input.identifier,
            name: input.name
          };
          signalState.senders.set(created.identifier, created);
          return created;
        }
      },
      eventDestination: {
        create: async (input: {
          tenantId: string;
          senderId: string;
          name: string;
          description?: string;
          eventTypes?: string[] | null;
          variant: { type: 'http_endpoint'; url: string; method: string };
        }) => {
          let destination = {
            id: signalState.nextId('dest'),
            tenantId: input.tenantId,
            senderId: input.senderId,
            name: input.name,
            description: input.description ?? null,
            eventTypes: input.eventTypes ?? null,
            webhook: {
              url: input.variant.url,
              method: input.variant.method
            }
          };
          signalState.destinations.push(destination);
          return destination;
        },
        update: async () => {
          throw new Error('signal.eventDestination.update not mocked for this test');
        },
        delete: async () => {
          throw new Error('signal.eventDestination.delete not mocked for this test');
        }
      },
      event: {
        create: async (input: {
          tenantId: string;
          senderId: string;
          topics: string[];
          eventType: string;
          payloadJson: string;
          headers: Record<string, string>;
          onlyForDestinations?: string[];
        }) => {
          let event = {
            id: signalState.nextId('event'),
            tenantId: input.tenantId,
            senderId: input.senderId,
            topics: input.topics,
            eventType: input.eventType,
            payloadJson: input.payloadJson,
            headers: input.headers,
            onlyForDestinations: input.onlyForDestinations
          };
          signalState.events.push(event);
          return event;
        }
      }
    },
    getTenantAndSenderForSignal: async (tenant: Tenant) => {
      let sender = await ensureSender();
      let signalTenant = tenant.signalTenantId
        ? { id: tenant.signalTenantId, identifier: tenant.identifier, name: tenant.name }
        : await ensureTenant(tenant);

      return {
        sender,
        tenant: {
          id: signalTenant.id,
          identifier: signalTenant.identifier
        }
      };
    }
  };
});

import { hubApp } from './index';
import { slateTriggerDestinationService } from '../../services/slateTriggerDestination';
import { slateTriggerReceiverService } from '../../services/slateTriggerReceiver';

const buildWebhookUrl = (receiverTriggerId: string, suffix?: string) =>
  `http://slates-hub.test/slates-hub/triggers/webhook/${receiverTriggerId}${
    suffix ? `/${suffix}` : ''
  }`;

describe('slate:trigger webhook E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
    signalState.destinations.length = 0;
    signalState.events.length = 0;
    signalState.tenants.clear();
    signalState.senders.clear();
    queueMocks.processAddMany.mockClear();
    queueMocks.processAdd.mockClear();
    queueMocks.sendAdd.mockClear();
    queueMocks.registerAddMany.mockClear();
    queueMocks.webhookAdd.mockClear();
    invocationMocks.handleWebhookRequest.mockReset();
    invocationMocks.invokeTriggerMapper.mockReset();
  });

  it('creates a signal event and stores the signalEventId for webhook-triggered events', async () => {
    const tenant = await f.tenant.withIdentifier('tenant-slates');

    const slate = await f.slate.complete({
      slateStatus: SlateStatus.active
    });

    const provider = await f.deploymentProvider.functionBay();

    const deployment = await f.slateDeployment.succeeded({
      slateVersionOid: slate.currentVersion.oid,
      slateOid: slate.oid,
      providerOid: provider.oid,
      functionId: 'fn_test'
    });

    const bucket = await f.storageBucket.default('test-invocations');

    const { instance } = await f.slateInstance.withConfig({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      specificationOid: slate.currentVersion.specification.oid
    });

    const triggerAction = await f.slateSpecification.withTriggerAction({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid,
      identifier: 'trigger.test',
      key: 'trigger.test'
    });

    const destination = await slateTriggerDestinationService.createTriggerDestination({
      tenant,
      input: {
        name: 'Webhook Destination',
        url: 'https://example.com/webhook',
        method: 'POST'
      }
    });

    const receiver = await slateTriggerReceiverService.createTriggerReceiver({
      tenant,
      input: {
        slateInstanceId: instance.id,
        destinations: [destination.id],
        triggers: [{ triggerId: triggerAction.id }]
      }
    });

    const receiverTriggerId = receiver.triggers[0]?.id;
    expect(receiverTriggerId).toBeDefined();

    const webhookInvocation = await f.slateInvocation.succeeded({
      deploymentOid: deployment.oid,
      bucketOid: bucket.oid,
      providerInvocationId: 'inv_webhook'
    });

    const mapInvocation = await f.slateInvocation.succeeded({
      deploymentOid: deployment.oid,
      bucketOid: bucket.oid,
      providerInvocationId: 'inv_map'
    });

    invocationMocks.handleWebhookRequest.mockResolvedValueOnce({
      status: 'success',
      invocation: { oid: webhookInvocation.oid },
      data: {
        inputs: [{ payload: 'incoming' }],
        updatedState: { cursor: 'next' }
      }
    });

    invocationMocks.invokeTriggerMapper.mockResolvedValueOnce({
      status: 'success',
      invocation: { oid: mapInvocation.oid },
      data: {
        id: 'event-source-1',
        type: 'record.created',
        output: { value: 123 }
      }
    });

    const res = await hubApp.fetch(
      new Request(buildWebhookUrl(receiverTriggerId, 'events'), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-test-header': 'present'
        },
        body: JSON.stringify({ hello: 'world' })
      })
    );

    expect(res.status).toBe(200);

    const requestRecord = await testDb.slateTriggerWebhookRequest.findFirst({
      where: { receiverTriggerId }
    });
    expect(requestRecord).toBeTruthy();

    await slateTriggerReceiverService.handleTriggerWebhook({
      receiverTriggerId,
      request: {
        url: requestRecord!.url,
        method: requestRecord!.method,
        headers: requestRecord!.headers as Record<string, string>,
        body: requestRecord!.body as { encoding: 'base64'; content: string } | null
      },
      requestLog: {
        id: requestRecord!.id,
        url: requestRecord!.url,
        method: requestRecord!.method,
        headers: requestRecord!.headers as Record<string, string>,
        bodyStorageKey: null
      }
    });

    const eventInput = await testDb.slateTriggerEventInput.findFirst({
      where: { receiverTriggerOid: receiver.triggers[0].oid }
    });
    expect(eventInput).toBeTruthy();

    await slateTriggerReceiverService.processTriggerEventInput({
      eventInputId: eventInput!.id
    });

    const triggerEvent = await testDb.slateTriggerEvent.findFirst({
      where: { receiverTriggerOid: receiver.triggers[0].oid }
    });
    expect(triggerEvent).toBeTruthy();

    expect(signalState.events).toHaveLength(1);
    expect(triggerEvent?.signalEventId).toBe(signalState.events[0].id);
    expect(signalState.events[0].onlyForDestinations).toEqual([
      destination.signalDestinationId
    ]);

    const payload = JSON.parse(signalState.events[0].payloadJson);
    expect(payload).toMatchObject({
      object: 'slate.trigger.event',
      triggerReceiverId: receiver.id,
      triggerId: triggerAction.id,
      triggerKey: triggerAction.key,
      type: 'record.created'
    });
  });

  it('ignores OPTIONS requests', async () => {
    const receiverTriggerId = 'trg_test_opts';

    const res = await hubApp.fetch(
      new Request(buildWebhookUrl(receiverTriggerId), {
        method: 'OPTIONS'
      })
    );

    expect(res.status).toBe(200);
    expect(await res.text()).toBe('');

    const record = await testDb.slateTriggerWebhookRequest.findFirst({
      where: { receiverTriggerId }
    });

    expect(record).toBeNull();
    expect(queueMocks.webhookAdd).not.toHaveBeenCalled();
  });
});
