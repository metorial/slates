import { createServer, rpcMux, type InferClient } from '@lowerdeck/rpc-server';
import { app } from './_app';
import { authController } from './auth';

export let rootController = app.controller({
  auth: authController
});

export let slatesHubAdminRPC = createServer({})(rootController);
export let slatesHubAdminApi = rpcMux({ path: '/slates-hub-admin' }, [
  slatesHubAdminRPC
]);

export type SlatesHubAdminClient = InferClient<typeof rootController>;
