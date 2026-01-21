import { describe, it, expect, beforeEach } from 'vitest';
import { SlateEventType } from '../../../../prisma/generated/client';
import { testDb, cleanDatabase } from '../../../test/setup';
import { fixtures } from '../../../test/fixtures';
import { slatesHubClient } from '../../../test/client';

describe('slateEvent:list E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns events for a slate', async () => {
    const { event, slate } = await f.slateEvent.withSlate({
      type: SlateEventType.version_pulled
    });

    await f.slateEvent.default({
      slateOid: slate.oid,
      slateVersionOid: slate.currentVersion.oid
    });

    const result = await slatesHubClient.slateEvent.list({
      slateId: slate.id,
      limit: 10
    });

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      object: 'slate.event',
      id: event.id,
      type: SlateEventType.version_pulled,
      message: expect.any(String),
      slateVersionId: slate.currentVersion.id,
      createdAt: expect.any(Date)
    });
  });

  it('filters by versionIds', async () => {
    const slate = await f.slate.complete();
    const event = await f.slateEvent.default({
      slateOid: slate.oid,
      slateVersionOid: slate.currentVersion.oid,
      type: SlateEventType.deployment_started
    });

    const result = await slatesHubClient.slateEvent.list({
      slateId: slate.id,
      versionIds: [slate.currentVersion.id],
      limit: 10
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.id).toBe(event.id);
  });
});

describe('slateEvent:get E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns a single event by ID', async () => {
    const { event, slate } = await f.slateEvent.withSlate({
      type: SlateEventType.discovery_succeeded
    });

    const result = await slatesHubClient.slateEvent.get({
      slateId: slate.id,
      slateEventId: event.id
    });

    expect(result).toMatchObject({
      object: 'slate.event',
      id: event.id,
      type: SlateEventType.discovery_succeeded
    });
  });
});
