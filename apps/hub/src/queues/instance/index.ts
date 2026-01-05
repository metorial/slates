import { combineQueueProcessors } from '@lowerdeck/queue';
import { slateInstanceConfigChangedQueueProcessor } from './configChanged';
import {
  createCredentialsUpdateEventQueueProcessor,
  createCredentialsUpdateEventsQueueProcessor
} from './credentials';
import { processAuthQueueProcessor } from './processAuth';

export let instanceQueues = combineQueueProcessors([
  createCredentialsUpdateEventsQueueProcessor,
  createCredentialsUpdateEventQueueProcessor,
  slateInstanceConfigChangedQueueProcessor,
  processAuthQueueProcessor
]);
