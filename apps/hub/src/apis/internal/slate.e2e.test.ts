import { describe, it, expect, beforeEach, assert } from 'vitest';
import { Paginator } from '@lowerdeck/pagination';
import { SlateStatus } from '../../../prisma/generated/client';
import { testDb, cleanDatabase } from '../../test/setup';
import { fixtures } from '../../test/fixtures';
import { slateService } from '../../services/slate';
import { slatePresenter } from '../../presenters/slate';
import _ from 'lodash';

describe('slate:list E2E', () => {
  const f = fixtures(testDb);

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('returns active slates with nested data', async () => {
    const slate = await f.slate.complete({
      slateStatus: SlateStatus.active,
    });

    const paginator = await slateService.listSlates({});
    const list = await paginator.run({ limit: 10 });
    const result = await Paginator.presentLight(list, slatePresenter);

    expect(result.items).toHaveLength(1);

    const [presented] = result.items;
    assert(presented);
    
    expect(presented).toMatchObject({
      object: 'slate',
      id: slate.id,
      identifier: slate.identifier,
      name: slate.name,
      registryId: slate.registry.id,
      currentVersion: {
        version: '1.0.0',
        specification: expect.anything(),
      },
    });
  });

  it('filters out inactive slates', async () => {
    const registry = await f.registry.default();

    await f.slate.complete({
      slateStatus: SlateStatus.active,
      slateIdentifier: 'active-slate',
      slateOverrides: { registryOid: registry.oid },
    });

    await f.slate.complete({
      slateStatus: SlateStatus.inactive,
      slateIdentifier: 'inactive-slate',
      slateOverrides: { registryOid: registry.oid },
    });

    const paginator = await slateService.listSlates({});
    const list = await paginator.run({ limit: 10 });
    const result = await Paginator.presentLight(list, slatePresenter);

    expect(result).toMatchObject({
      items: [{ identifier: 'active-slate' }],
    });
  });

  it('returns paginated results with correct metadata', async () => {
    const registry = await f.registry.default();

    await Promise.all(
      _.times(10, (i) =>
        f.slate.complete({
          slateIdentifier: `slate-${i}`,
          slateStatus: SlateStatus.active,
          slateOverrides: { registryOid: registry.oid },
        })
      )
    );

    const paginator = await slateService.listSlates({});
    const firstPageList = await paginator.run({ limit: 4 });
    const firstPage = await Paginator.presentLight(
      firstPageList,
      slatePresenter
    );
    expect(firstPage.items).toHaveLength(4);
    expect(firstPage.pagination).toMatchObject({
      has_more_after: true,
    });

    const lastItemId = firstPage?.items?.[firstPage.items.length - 1]?.id;
    const secondPageList = await paginator.run({
      limit: 4,
      after: lastItemId,
    });
    const secondPage = await Paginator.presentLight(
      secondPageList,
      slatePresenter
    );
    expect(secondPage.items).toHaveLength(4);
    expect(secondPage.pagination).toMatchObject({
      has_more_after: true,
    });

    const firstPageIds = firstPage.items.map((s: any) => s.id);
    const secondPageIds = secondPage.items.map((s: any) => s.id);
    const intersection = firstPageIds.filter((id) =>
      secondPageIds.includes(id)
    );
    expect(intersection).toHaveLength(0);
  });

  it('presenter formats all fields correctly', async () => {
    const slate = await f.slate.complete({
      slateStatus: SlateStatus.active,
    });

    const paginator = await slateService.listSlates({});
    const list = await paginator.run({ limit: 10 });
    const result = await Paginator.presentLight(list, slatePresenter);
    const presented = result.items[0];

    expect(presented).toMatchObject({
      object: 'slate',
      id: slate.id,
      identifier: slate.identifier,
      name: slate.name,
      description: slate.description,
      registryId: slate.registry.id,
      scope: {
        object: 'slate.registry_scope',
        registryId: slate.registry.id,
        id: slate.slateScopeIdOnRegistry,
        identifier: slate.slateScopeIdentifierOnRegistry,
      },
      slate: {
        object: 'slate.registry_slate',
        registryId: slate.registry.id,
        id: slate.slateIdOnRegistry,
        identifier: slate.slateIdentifierOnRegistry,
        fullIdentifier: slate.slateFullIdentifierOnRegistry,
      },
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});
