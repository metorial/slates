import { createFunctionBayClient } from '@metorial-services/function-bay-client';
import { db } from './db';
import { env } from './env';
import { getId } from './id';

export let functionBay: ReturnType<typeof createFunctionBayClient> = createFunctionBayClient({
  endpoint: env.functionBay.FUNCTION_BAY_API_URL
});

export let functionBayTenant = await functionBay.tenant.upsert({
  name: 'Slates Hub Tenant',
  identifier: env.functionBay.FUNCTION_BAY_TENANT_IDENTIFIER
});

export let functionBayProvider = await db.deploymentProvider.upsert({
  where: { identifier: 'function-bay' },
  create: {
    ...getId('deploymentProvider'),
    name: 'Function Bay',
    identifier: 'function-bay'
  },
  update: {}
});
