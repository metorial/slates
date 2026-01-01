import { runQueueProcessors } from '@lowerdeck/queue';
import { deploymentQueues } from './queues/deployment';
import { registryQueues } from './queues/registry';

await runQueueProcessors([registryQueues, deploymentQueues]);
