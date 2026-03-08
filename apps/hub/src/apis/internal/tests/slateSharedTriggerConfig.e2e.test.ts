import { beforeEach, describe, expect, it } from 'vitest';
import { SlateSharedTriggerConfigStatus } from '../../../../prisma/generated/client';
import { slatesHubClient } from '../../../test/client';
import { fixtures } from '../../../test/fixtures';
import { cleanDatabase, testDb } from '../../../test/setup';

describe('slateSharedTriggerConfig E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('creates a shared config with destinations and triggers and updates trigger settings', async () => {
    let tenant = await f.tenant.default();
    let slate = await f.slate.complete();
    let destination = await f.slateTriggerDestination.default({
      tenantOid: tenant.oid
    });
    let triggerAction = await f.slateSpecification.withTriggerAction({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid,
      key: 'orders.created'
    });

    let created = await slatesHubClient.slateSharedTriggerConfig.create({
      tenantId: tenant.id,
      slateId: slate.id,
      name: 'Orders shared config',
      description: 'Shared callback settings',
      status: SlateSharedTriggerConfigStatus.active,
      destinationIds: [destination.id],
      triggers: [
        {
          triggerId: triggerAction.id,
          eventTypes: ['orders.created'],
          pollIntervalSecondsOverride: 900
        }
      ]
    });

    expect(created).toMatchObject({
      object: 'slate.shared_trigger_config',
      slateId: slate.id,
      status: SlateSharedTriggerConfigStatus.active,
      name: 'Orders shared config',
      description: 'Shared callback settings',
      destinations: [
        expect.objectContaining({
          id: destination.id
        })
      ],
      triggers: [
        expect.objectContaining({
          triggerId: triggerAction.id,
          triggerKey: triggerAction.key,
          eventTypes: ['orders.created'],
          pollIntervalSecondsOverride: 900
        })
      ]
    });

    let updated = await slatesHubClient.slateSharedTriggerConfig.triggerUpdate({
      tenantId: tenant.id,
      slateSharedTriggerConfigTriggerId: created.triggers[0]!.id,
      eventTypes: ['orders.updated'],
      pollIntervalSecondsOverride: 1200
    });

    expect(updated.triggers).toEqual([
      expect.objectContaining({
        id: created.triggers[0]!.id,
        eventTypes: ['orders.updated'],
        pollIntervalSecondsOverride: 1200
      })
    ]);
  });
});
