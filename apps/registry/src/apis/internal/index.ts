import { apiMux } from '@lowerdeck/api-mux';
import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { instanceController } from './instance';
import { readerTokenController } from './readerTokens';
import { userController } from './user';
import { workspaceController } from './workspace';

export let rootController = app.controller({
  instance: instanceController,
  user: userController,
  workspace: workspaceController,
  readerToken: readerTokenController
});

export let slatesRegistryRPC = createServer({})(rootController);
export let slatesRegistryApi = apiMux([
  { endpoint: rpcMux({ path: '/slates-registry' }, [slatesRegistryRPC]) }
]);

export type SlatesRegistryClient = InferClient<typeof rootController>;
