import { beforeEach, describe, expect, it } from 'vitest';
import { SlateTriggerReceiverTriggerSource } from '../../../../prisma/generated/client';
import { slatesHubClient } from '../../../test/client';
import { fixtures } from '../../../test/fixtures';
import { cleanDatabase, testDb } from '../../../test/setup';

describe('slateTriggerBinding E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('upserts one polling binding per external key and lists it via shared config filters', async () => {
    let tenant = await f.tenant.default();
    let slate = await f.slate.complete();
    let provider = await f.deploymentProvider.functionBay();
    await f.slateDeployment.succeeded({
      slateVersionOid: slate.currentVersion.oid,
      slateOid: slate.oid,
      providerOid: provider.oid
    });
    let { instance } = await f.slateInstance.withConfig({
      slateOid: slate.oid,
      tenantOid: tenant.oid,
      specificationOid: slate.currentVersion.specification.oid
    });
    let triggerAction = await f.slateSpecification.withTriggerAction({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid,
      key: 'orders.created',
      actionOverrides: {
        spec: {
          id: 'trigger.orders.created',
          name: 'Orders Created',
          type: 'action.trigger',
          inputSchema: {},
          outputSchema: {},
          capabilities: {},
          invocation: {
            type: 'polling',
            intervalSeconds: 60
          }
        } as any
      }
    });

    let sharedConfig = await slatesHubClient.slateSharedTriggerConfig.create({
      tenantId: tenant.id,
      slateId: slate.id,
      name: 'Orders shared config',
      triggers: [
        {
          triggerId: triggerAction.id,
          eventTypes: ['orders.created'],
          pollIntervalSecondsOverride: 120
        }
      ]
    });

    let created = await slatesHubClient.slateTriggerBinding.upsert({
      tenantId: tenant.id,
      slateSharedTriggerConfigTriggerId: sharedConfig.triggers[0]!.id,
      slateInstanceId: instance.id,
      externalKey: 'callback:orders:pair-1:trigger-1'
    });

    let updated = await slatesHubClient.slateTriggerBinding.upsert({
      tenantId: tenant.id,
      slateSharedTriggerConfigTriggerId: sharedConfig.triggers[0]!.id,
      slateInstanceId: instance.id,
      externalKey: 'callback:orders:pair-1:trigger-1'
    });

    let listed = await slatesHubClient.slateTriggerBinding.list({
      tenantId: tenant.id,
      slateSharedTriggerConfigIds: [sharedConfig.id],
      limit: 10
    });

    expect(created).toMatchObject({
      object: 'slate.trigger.binding',
      sharedTriggerConfigId: sharedConfig.id,
      sharedTriggerConfigTriggerId: sharedConfig.triggers[0]!.id,
      slateInstanceId: instance.id,
      externalKey: 'callback:orders:pair-1:trigger-1',
      source: SlateTriggerReceiverTriggerSource.polling,
      pollIntervalSeconds: 600
    });
    expect(updated.id).toBe(created.id);
    expect(listed.items).toHaveLength(1);
    expect(listed.items[0]).toMatchObject({
      id: created.id,
      sharedTriggerConfigId: sharedConfig.id
    });
  });
});
