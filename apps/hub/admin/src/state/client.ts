import { createClient } from '@lowerdeck/rpc-client';
import type { SlatesHubClient } from '../../../src/apis/internal';

let getAuthHeaders = (): Record<string, string> => {
  return {};
};

let endpoint = `${window.location.origin}/slates-hub`;

export let hubClient = createClient<SlatesHubClient>({
  endpoint,
  getHeaders: () => getAuthHeaders()
});
