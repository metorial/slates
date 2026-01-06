import { createClient } from '@lowerdeck/rpc-client';
import { ClientOpts } from '@lowerdeck/rpc-client/dist/shared/clientBuilder';
import type { SlatesHubClient } from '../../../apps/hub/src/apis/internal';

export let createSlatesHubInternalClient = (o: ClientOpts) => createClient<SlatesHubClient>(o);
