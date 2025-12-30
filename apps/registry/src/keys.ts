import { createApiKeyGenerator } from '@lowerdeck/api-key';

export let apiKeys = createApiKeyGenerator(
  { regtoken: 'user_auth_token' },
  { prefix: 'slates' }
);
