import { createCron } from '@lowerdeck/cron';
import { createLock } from '@lowerdeck/lock';
import { createQueue } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';
import { slateTriggerReceiverService } from '../../services/slateTriggerReceiver';

export let slateTriggerPollingCron = createCron(
  {
    name: 'shub/trg/poll/cron',
    redisUrl: env.service.REDIS_URL,
    cron: '* * * * *'
  },
  async () => {
    await slateTriggerPollingBatchQueue.add({});
  }
);

let slateTriggerPollingBatchQueue = createQueue<{ cursor?: string }>({
  name: 'shub/trg/poll/batch',
  redisUrl: env.service.REDIS_URL
});

export let slateTriggerPollingBatchQueueProcessor = slateTriggerPollingBatchQueue.process(
  async data => {
    let now = new Date();

    let triggers = await db.slateTriggerReceiverTrigger.findMany({
      where: {
        source: 'polling',
        nextPollAt: { lte: now },
        receiver: { status: 'active' },
        id: data.cursor ? { gt: data.cursor } : undefined
      },
      take: 100,
      orderBy: { id: 'asc' },
      select: { id: true }
    });
    if (triggers.length === 0) return;

    for (let trigger of triggers) {
      await slateTriggerPollQueue.add(
        { receiverTriggerId: trigger.id },
        { id: trigger.id }
      );
    }

    await slateTriggerPollingBatchQueue.add({
      cursor: triggers[triggers.length - 1]!.id
    });
  }
);

let slateTriggerPollQueue = createQueue<{ receiverTriggerId: string }>({
  name: 'shub/trg/poll',
  redisUrl: env.service.REDIS_URL,
  workerOpts: {
    concurrency: 5,
    limiter: {
      max: 25,
      duration: 10_000
    }
  }
});

let pollLock = createLock({
  name: 'shub/trg/poll/lock',
  redisUrl: env.service.REDIS_URL
});

export let slateTriggerPollQueueProcessor = slateTriggerPollQueue.process(async data => {
  let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
    where: { id: data.receiverTriggerId },
    select: { id: true }
  });
  if (!receiverTrigger) return;

  return pollLock.usingLock(receiverTrigger.id, async () => {
    await slateTriggerReceiverService.pollTriggerReceiverTrigger({
      receiverTriggerId: receiverTrigger.id
    });
  });
});
