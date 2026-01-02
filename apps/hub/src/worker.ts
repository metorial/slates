import { runQueueProcessors } from '@lowerdeck/queue';
import { deploymentQueues } from './queues/deployment';
import { discoveryQueues } from './queues/discovery';
import { registryQueues } from './queues/registry';

await runQueueProcessors([registryQueues, deploymentQueues, discoveryQueues]);
