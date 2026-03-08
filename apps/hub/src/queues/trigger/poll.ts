import { createCron } from '@lowerdeck/cron';
import { createLock } from '@lowerdeck/lock';
import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import { getSentry } from '@lowerdeck/sentry';
import { db } from '../../db';
import { env } from '../../env';
import { slateTriggerBindingService } from '../../services/slateTriggerBinding';

let Sentry = getSentry();

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
    try {
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

      await slateTriggerPollQueue.addMany(triggers.map(trigger => ({ triggerBindingId: trigger.id })));

      await slateTriggerPollingBatchQueue.add({
        cursor: triggers[triggers.length - 1]!.id
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error('Failed to enqueue polling triggers:', error);
      throw new QueueRetryError();
    }
  }
);

let slateTriggerPollQueue = createQueue<{ triggerBindingId: string }>({
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
  try {
    let binding = await db.slateTriggerReceiverTrigger.findFirst({
      where: { id: data.triggerBindingId },
      select: { id: true }
    });
    if (!binding) return;

    return pollLock.usingLock(binding.id, async () => {
      await slateTriggerBindingService.pollTriggerBinding({
        triggerBindingId: binding.id
      });
    });
  } catch (error) {
    Sentry.captureException(error, {
      extra: { triggerBindingId: data.triggerBindingId }
    });
    console.error('Failed to poll trigger binding:', {
      triggerBindingId: data.triggerBindingId,
      error
    });
    throw new QueueRetryError();
  }
});
