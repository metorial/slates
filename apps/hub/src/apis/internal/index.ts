import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { registryController } from './registry';
import { secretController } from './secret';
import { slateController } from './slate';
import { slateDeploymentController } from './slateDeployment';
import { slateInvocationController } from './slateInvocation';
import { slateSpecificationController } from './slateSpecification';
import { slateVersionController } from './slateVersion';
import { tenantController } from './tenant';

export let rootController = app.controller({
  tenant: tenantController,
  secret: secretController,

  registry: registryController,

  slate: slateController,
  slateVersion: slateVersionController,
  slateInvocation: slateInvocationController,
  slateDeployment: slateDeploymentController,
  slateSpecification: slateSpecificationController
});

export let slatesHubRPC = createServer({})(rootController);
export let slatesHubApi = apiMux([
  { endpoint: rpcMux({ path: '/slates-hub' }, [slatesHubRPC]) }
]);

export type SlatesHubClient = InferClient<typeof rootController>;
