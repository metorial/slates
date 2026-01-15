import { createLock } from '@lowerdeck/lock';
import { createQueue } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';
import { slateTriggerReceiverService } from '../../services/slateTriggerReceiver';

export type TriggerWebhookQueuePayload = {
  receiverTriggerId: string;
  request: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: { encoding: 'base64'; content: string } | null;
  };
};

export let slateTriggerWebhookQueue = createQueue<TriggerWebhookQueuePayload>({
  name: 'shub/trg/webhook',
  redisUrl: env.service.REDIS_URL,
  workerOpts: {
    concurrency: 10,
    limiter: {
      max: 50,
      duration: 10_000
    }
  }
});

let webhookLock = createLock({
  name: 'shub/trg/webhook/lock',
  redisUrl: env.service.REDIS_URL
});

export let slateTriggerWebhookQueueProcessor = slateTriggerWebhookQueue.process(async data => {
  let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
    where: { id: data.receiverTriggerId },
    select: { id: true }
  });
  if (!receiverTrigger) return;

  return webhookLock.usingLock(receiverTrigger.id, async () => {
    await slateTriggerReceiverService.handleTriggerWebhook({
      receiverTriggerId: receiverTrigger.id,
      request: data.request
    });
  });
});
