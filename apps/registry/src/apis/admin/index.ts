import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { subRegistryController } from './subRegistry';
import { tenantController } from './tenant';
import { userController } from './user';
import { workspaceController } from './workspace';

export let rootController = app.controller({
  tenant: tenantController,
  user: userController,
  workspace: workspaceController,
  subRegistry: subRegistryController
});

export let slatesRegistryAdminRPC = createServer({})(rootController);
export let slatesRegistryAdminApi = apiMux([
  { endpoint: rpcMux({ path: '/slates-registryAdmin-admin' }, [slatesRegistryAdminRPC]) }
]);

export type SlatesRegistryAdminClient = InferClient<typeof rootController>;
