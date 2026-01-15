import { QueueRetryError } from '@lowerdeck/queue';
import { db } from '../../db';
import { slateTriggerReceiverService } from '../../services/slateTriggerReceiver';
import { slateTriggerEventSendQueue } from './eventQueues';

export let slateTriggerEventSendQueueProcessor = slateTriggerEventSendQueue.process(
  async data => {
    let event = await db.slateTriggerEvent.findFirst({
      where: { id: data.eventId },
      select: { id: true }
    });
    if (!event) return;

    try {
      await slateTriggerReceiverService.sendTriggerEvent({ eventId: event.id });
    } catch (error) {
      console.error('Failed to send trigger event:', error);
      throw new QueueRetryError();
    }
  }
);
