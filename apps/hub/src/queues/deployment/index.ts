import { combineQueueProcessors } from '@lowerdeck/queue';
import {
  deploySlateVersionCompletedQueueProcessor,
  deploySlateVersionFailedQueueProcessor,
  deploySlateVersionMonitorQueueProcessor,
  deploySlateVersionProviderCompletedQueueProcessor,
  deploySlateVersionQueueProcessor,
  deploySlateVersionStartQueueProcessor
} from './deploy';

export let deploymentQueues = combineQueueProcessors([
  deploySlateVersionQueueProcessor,
  deploySlateVersionStartQueueProcessor,
  deploySlateVersionMonitorQueueProcessor,
  deploySlateVersionProviderCompletedQueueProcessor,
  deploySlateVersionCompletedQueueProcessor,
  deploySlateVersionFailedQueueProcessor
]);
