import { QueueRetryError } from '@lowerdeck/queue';
import { getSentry } from '@lowerdeck/sentry';
import { db } from '../../db';
import { slateTriggerBindingService } from '../../services/slateTriggerBinding';
import { slateTriggerEventProcessQueue } from './eventQueues';

let Sentry = getSentry();

export let slateTriggerEventProcessQueueProcessor = slateTriggerEventProcessQueue.process(
  async data => {
    let eventInput = await db.slateTriggerEventInput.findFirst({
      where: { id: data.eventInputId },
      select: { id: true }
    });
    if (!eventInput) return;

    try {
      await slateTriggerBindingService.processTriggerEventInput({
        eventInputId: eventInput.id
      });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { eventInputId: data.eventInputId }
      });
      console.error('Failed to process trigger event input:', error);
      throw new QueueRetryError();
    }
  }
);
