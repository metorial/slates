import { describe, it, expect, beforeEach } from 'vitest';
import { SlateTriggerEventDeliveryStatus } from '../../../prisma/generated/client';
import { testDb, cleanDatabase } from '../../test/setup';
import { fixtures } from '../../test/fixtures';
import { slatesHubClient } from '../../test/client';

describe('slateTriggerEvent:list E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns trigger events for a tenant', async () => {
    const { event, tenant, receiver, receiverTrigger, triggerAction } =
      await f.slateTriggerEvent.complete();

    // Create additional event for pagination testing
    const { slate, instance, invocation } = await (async () => {
      const provider = await f.deploymentProvider.default();
      const slate = await f.slate.complete();
      const deployment = await f.slateDeployment.default({
        slateOid: slate.oid,
        slateVersionOid: slate.currentVersion.oid,
        providerOid: provider.oid
      });
      const bucket = await f.storageBucket.default();
      const instance = await f.slateInstance.default({
        slateOid: slate.oid,
        tenantOid: tenant.oid
      });
      const invocation = await f.slateInvocation.default({
        deploymentOid: deployment.oid,
        bucketOid: bucket.oid
      });
      return { slate, instance, invocation };
    })();
    await f.slateTriggerEvent.default({
      receiverOid: receiver.oid,
      receiverTriggerOid: receiverTrigger.oid,
      actionOid: triggerAction.oid,
      slateOid: slate.oid,
      instanceOid: instance.oid,
      invocationOid: invocation.oid
    });

    const result = await slatesHubClient.slateTriggerEvent.list({
      tenantId: tenant.id,
      limit: 10
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      object: 'slate.trigger.event',
      id: event.id,
      type: 'test.event',
      deliveryStatus: SlateTriggerEventDeliveryStatus.pending,
      createdAt: expect.any(Date)
    });
    expect(result.pagination).toMatchObject({
      has_more_after: false,
      has_more_before: false
    });
  });

  it('filters by triggerReceiverIds', async () => {
    const { event: event1, tenant, receiver: receiver1 } = await f.slateTriggerEvent.complete();
    await f.slateTriggerEvent.complete();

    const result = await slatesHubClient.slateTriggerEvent.list({
      tenantId: tenant.id,
      triggerReceiverIds: [receiver1.id],
      limit: 10
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(event1.id);
  });

  it('filters by eventTypes', async () => {
    const { event, tenant } = await f.slateTriggerEvent.complete({
      eventOverrides: { type: 'custom.event' }
    });
    await f.slateTriggerEvent.complete({
      eventOverrides: { type: 'other.event' }
    });

    const result = await slatesHubClient.slateTriggerEvent.list({
      tenantId: tenant.id,
      eventTypes: ['custom.event'],
      limit: 10
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(event.id);
  });
});

describe('slateTriggerEvent:get E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns a single trigger event by ID', async () => {
    const { event, tenant } = await f.slateTriggerEvent.complete();

    const result = await slatesHubClient.slateTriggerEvent.get({
      tenantId: tenant.id,
      slateTriggerEventId: event.id
    });

    expect(result).toMatchObject({
      object: 'slate.trigger.event',
      id: event.id,
      type: 'test.event'
    });
  });
});
