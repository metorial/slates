import { combineQueueProcessors } from '@lowerdeck/queue';
import { registrySyncCron, syncRegistryAllQueueProcessor } from './cron';
import { syncRegistryQueueProcessor } from './syncRegistry';
import { syncSlateQueueProcessor } from './syncSlate';

export let registryQueues = combineQueueProcessors([
  registrySyncCron,
  syncRegistryAllQueueProcessor,

  syncRegistryQueueProcessor,

  syncSlateQueueProcessor
]);
