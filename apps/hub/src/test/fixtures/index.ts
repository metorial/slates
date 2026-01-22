import type { PrismaClient } from '../../../prisma/generated/client';
import { RegistryFixtures } from './registryFixtures';
import { SlateFixtures } from './slateFixtures';
import { SlateVersionFixtures } from './slateVersionFixtures';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';
import { TenantFixtures } from './tenantFixtures';
import { DeploymentProviderFixtures, SlateDeploymentFixtures } from './deploymentFixtures';
import {
  SlateConfigSchemaFixtures,
  SlateInstanceFixtures,
  SlateInstanceConfigFixtures
} from './instanceFixtures';
import {
  SlateInvocationStorageBucketFixtures,
  SlateInvocationFixtures
} from './invocationFixtures';
import { SecretFixtures } from './secretFixtures';
import { SlateSessionFixtures } from './slateSessionFixtures';
import { SlateEventFixtures } from './slateEventFixtures';
import { ChangeNotificationFixtures } from './changeNotificationFixtures';
import { SlateSpecificationChangeFixtures } from './slateSpecificationChangeFixtures';
import { SlateVersionDiscoveryFixtures } from './slateVersionDiscoveryFixtures';
import { SlateAuthMethodFixtures } from './slateAuthMethodFixtures';
import { SlateOAuthCredentialsFixtures } from './slateOAuthCredentialsFixtures';
import { SlateAuthConfigFixtures } from './slateAuthConfigFixtures';
import { SlateOAuthSetupFixtures } from './slateOAuthSetupFixtures';
import { SlateTriggerDestinationFixtures } from './slateTriggerDestinationFixtures';
import { SlateTriggerReceiverFixtures } from './slateTriggerReceiverFixtures';
import { SlateTriggerEventFixtures } from './slateTriggerEventFixtures';
import { SlateTriggerInvocationFixtures } from './slateTriggerInvocationFixtures';
import { SlateTriggerDeliveryFixtures } from './slateTriggerDeliveryFixtures';
import { SlateSessionToolCallFixtures } from './slateSessionToolCallFixtures';

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
    secret: new SecretFixtures(db),
    slateSession: new SlateSessionFixtures(db),
    slateEvent: new SlateEventFixtures(db),
    changeNotification: new ChangeNotificationFixtures(db),
    slateSpecificationChange: new SlateSpecificationChangeFixtures(db),
    slateVersionDiscovery: new SlateVersionDiscoveryFixtures(db),
    slateAuthMethod: new SlateAuthMethodFixtures(db),
    slateOAuthCredentials: new SlateOAuthCredentialsFixtures(db),
    slateAuthConfig: new SlateAuthConfigFixtures(db),
    slateOAuthSetup: new SlateOAuthSetupFixtures(db),
    slateTriggerDestination: new SlateTriggerDestinationFixtures(db),
    slateTriggerReceiver: new SlateTriggerReceiverFixtures(db),
    slateTriggerEvent: new SlateTriggerEventFixtures(db),
    slateTriggerInvocation: new SlateTriggerInvocationFixtures(db),
    slateTriggerDelivery: new SlateTriggerDeliveryFixtures(db),
    slateSessionToolCall: new SlateSessionToolCallFixtures(db)
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
  SecretFixtures,
  SlateSessionFixtures,
  SlateEventFixtures,
  ChangeNotificationFixtures,
  SlateSpecificationChangeFixtures,
  SlateVersionDiscoveryFixtures,
  SlateAuthMethodFixtures,
  SlateOAuthCredentialsFixtures,
  SlateAuthConfigFixtures,
  SlateOAuthSetupFixtures,
  SlateTriggerDestinationFixtures,
  SlateTriggerReceiverFixtures,
  SlateTriggerEventFixtures,
  SlateTriggerInvocationFixtures,
  SlateTriggerDeliveryFixtures,
  SlateSessionToolCallFixtures
};
