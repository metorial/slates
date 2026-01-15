import { combineQueueProcessors } from '@lowerdeck/queue';
import {
  slateTriggerPollQueueProcessor,
  slateTriggerPollingBatchQueueProcessor,
  slateTriggerPollingCron
} from './poll';
import { slateTriggerEventProcessQueueProcessor } from './process';
import { slateTriggerWebhookRegisterQueueProcessor, slateTriggerWebhookUnregisterQueueProcessor } from './register';
import { slateTriggerEventSendQueueProcessor } from './send';
import { slateTriggerWebhookQueueProcessor } from './webhook';

export let triggerQueues = combineQueueProcessors([
  slateTriggerPollingCron,
  slateTriggerPollingBatchQueueProcessor,
  slateTriggerPollQueueProcessor,
  slateTriggerWebhookQueueProcessor,
  slateTriggerEventProcessQueueProcessor,
  slateTriggerEventSendQueueProcessor,
  slateTriggerWebhookRegisterQueueProcessor,
  slateTriggerWebhookUnregisterQueueProcessor
]);
