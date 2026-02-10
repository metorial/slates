import { ProgrammablePromise } from '@lowerdeck/programmable-promise';
import { createFunctionBayClient } from '@metorial-services/function-bay-client';
import { db } from './db';
import { env } from './env';
import { getId } from './id';

export let functionBay: ReturnType<typeof createFunctionBayClient> = createFunctionBayClient({
  endpoint: env.functionBay.FUNCTION_BAY_API_URL
});

let functionBayTenantPromise = new ProgrammablePromise<
  Awaited<ReturnType<typeof functionBay.tenant.upsert>>
>();
export let functionBayTenant = functionBayTenantPromise.promise;

export let functionBayProvider = await db.deploymentProvider.upsert({
  where: { identifier: 'function-bay' },
  create: {
    ...getId('deploymentProvider'),
    name: 'Function Bay',
    identifier: 'function-bay'
  },
  update: {}
});

async () => {
  while (true) {
    try {
      let ten = await functionBay.tenant.upsert({
        name: 'Slates Hub Tenant',
        identifier: env.functionBay.FUNCTION_BAY_TENANT_IDENTIFIER
      });
      functionBayTenantPromise.resolve(ten);

      console.log(`Function Bay tenant ID: ${ten.id}`);
    } catch (err) {
      console.log('Unable to create function bay tenant', err);
    }
  }
};
