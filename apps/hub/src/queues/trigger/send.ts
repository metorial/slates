import { QueueRetryError } from '@lowerdeck/queue';
import { getSentry } from '@lowerdeck/sentry';
import { db } from '../../db';
import { slateTriggerBindingService } from '../../services/slateTriggerBinding';
import { slateTriggerEventSendQueue } from './eventQueues';

let Sentry = getSentry();

export let slateTriggerEventSendQueueProcessor = slateTriggerEventSendQueue.process(
  async data => {
    let event = await db.slateTriggerEvent.findFirst({
      where: { id: data.eventId },
      select: { id: true }
    });
    if (!event) return;

    try {
      await slateTriggerBindingService.sendTriggerEvent({ eventId: event.id });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { eventId: data.eventId }
      });
      console.error('Failed to send trigger event:', error);
      throw new QueueRetryError();
    }
  }
);
