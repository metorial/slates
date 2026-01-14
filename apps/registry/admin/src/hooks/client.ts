import { createClient } from '@lowerdeck/rpc-client';
import type { SlatesRegistryAdminClient } from '../../../src/apis/admin';

let getAuthHeaders = (): Record<string, string> => {
  return {};
};

let endpoint = `${window.location.origin}/slates-registry-admin`;

export let adminClient = createClient<SlatesRegistryAdminClient>({
  endpoint,
  getHeaders: () => getAuthHeaders()
});
