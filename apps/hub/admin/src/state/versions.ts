import { createLoader } from '@metorial-io/data-hooks';
import { hubClient } from './client.js';
import { slateLoader } from './slates.js';
import { usePaginatedLoader } from './usePaginatedLoader.js';

export let slateVersionsLoader = createLoader({
  name: 'slateVersions',
  fetch: (params: { slateId: string; after?: string; before?: string }) =>
    hubClient.slateVersion.list(params),
  mutators: {},
  parents: [slateLoader]
});

export let useSlateVersions = (slateId: string | undefined) =>
  usePaginatedLoader(slateVersionsLoader, slateId ? { slateId } : null);

export let slateVersionLoader = createLoader({
  name: 'slateVersion',
  fetch: (params: { slateId: string; slateVersionId: string }) =>
    hubClient.slateVersion.get(params),
  mutators: {},
  parents: [slateVersionsLoader]
});

export let useSlateVersion = (slateId: string | undefined, versionId: string | undefined) =>
  slateVersionLoader.use(slateId && versionId ? { slateId, slateVersionId: versionId } : null);

let versionSpecificationLoader = createLoader({
  name: 'versionSpecification',
  fetch: (params: { slateId: string; slateVersionId: string; slateDiscoveryId: string }) =>
    hubClient.slateDiscovery.getSpecification(params),
  mutators: {}
});

export let useVersionSpecification = (
  slateId: string | undefined,
  versionId: string | undefined,
  discoveryId: string | undefined
) =>
  versionSpecificationLoader.use(
    slateId && versionId && discoveryId
      ? { slateId, slateVersionId: versionId, slateDiscoveryId: discoveryId }
      : null
  );
