import { createValidatedEnv } from '@lowerdeck/env';
import { v } from '@lowerdeck/validation';

export let env = createValidatedEnv({
  service: {
    REDIS_URL: v.string(),
    DATABASE_URL: v.string()
  },

  functionBay: {
    FUNCTION_BAY_API_URL: v.string(),
    FUNCTION_BAY_TENANT_IDENTIFIER: v.string(),

    FUNCTION_BAY_DEFAULT_MEMORY_MB: v.number(),
    FUNCTION_BAY_DEFAULT_TIMEOUT_SECONDS: v.number()
  },

  encryption: {
    ENCRYPTION_KEY: v.string()
  },

  registry: {
    INITIAL_REGISTRIES: v.optional(v.string())
  },

  slates: {
    SLATES_HUB_INSTANCE_IDENTIFIER: v.string()
  }
});
