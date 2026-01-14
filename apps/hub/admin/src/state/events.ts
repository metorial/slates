import { createLoader } from '@metorial-io/data-hooks';
import { hubClient } from './client.js';
import { usePaginatedLoader } from './usePaginatedLoader.js';

export let allEventsLoader = createLoader({
  name: 'allEvents',
  fetch: (params: { after?: string; before?: string }) => hubClient.slateEvent.listAll(params),
  mutators: {}
});

export let useAllEvents = () => usePaginatedLoader(allEventsLoader, {});

export let slateEventsLoader = createLoader({
  name: 'slateEvents',
  fetch: (params: {
    slateId: string;
    versionIds?: string[];
    after?: string;
    before?: string;
  }) => hubClient.slateEvent.list(params),
  mutators: {}
});

export let useSlateEvents = (slateId: string | undefined, versionIds?: string[]) =>
  usePaginatedLoader(slateEventsLoader, slateId ? { slateId, versionIds } : null);
