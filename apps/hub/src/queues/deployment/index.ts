import { combineQueueProcessors } from '@lowerdeck/queue';
import {
  deploySlateVersionCompletedQueueProcessor,
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
  deploySlateVersionCompletedQueueProcessor
]);
