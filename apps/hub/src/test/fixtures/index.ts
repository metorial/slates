import type { PrismaClient } from '../../../prisma/generated/client';
import { RegistryFixtures } from './registryFixtures';
import { SlateFixtures } from './slateFixtures';
import { SlateVersionFixtures } from './slateVersionFixtures';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';
import { TenantFixtures } from './tenantFixtures';
import {
  DeploymentProviderFixtures,
  SlateDeploymentFixtures,
} from './deploymentFixtures';
import {
  SlateConfigSchemaFixtures,
  SlateInstanceFixtures,
  SlateInstanceConfigFixtures,
} from './instanceFixtures';
import {
  SlateInvocationStorageBucketFixtures,
  SlateInvocationFixtures,
} from './invocationFixtures';

export function fixtures(db: PrismaClient) {
  return {
    registry: new RegistryFixtures(db),
    slate: new SlateFixtures(db),
    slateVersion: new SlateVersionFixtures(db),
    slateSpecification: new SlateSpecificationFixtures(db),
    tenant: new TenantFixtures(db),
    deploymentProvider: new DeploymentProviderFixtures(db),
    slateDeployment: new SlateDeploymentFixtures(db),
    slateConfigSchema: new SlateConfigSchemaFixtures(db),
    slateInstance: new SlateInstanceFixtures(db),
    slateInstanceConfig: new SlateInstanceConfigFixtures(db),
    storageBucket: new SlateInvocationStorageBucketFixtures(db),
    slateInvocation: new SlateInvocationFixtures(db),
  };
}

export {
  RegistryFixtures,
  SlateFixtures,
  SlateVersionFixtures,
  SlateSpecificationFixtures,
  TenantFixtures,
  DeploymentProviderFixtures,
  SlateDeploymentFixtures,
  SlateConfigSchemaFixtures,
  SlateInstanceFixtures,
  SlateInstanceConfigFixtures,
  SlateInvocationStorageBucketFixtures,
  SlateInvocationFixtures,
};
