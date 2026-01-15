import { QueueRetryError } from '@lowerdeck/queue';
import { db } from '../../db';
import { slateTriggerReceiverService } from '../../services/slateTriggerReceiver';
import { slateTriggerEventProcessQueue } from './eventQueues';

export let slateTriggerEventProcessQueueProcessor = slateTriggerEventProcessQueue.process(
  async data => {
    let eventInput = await db.slateTriggerEventInput.findFirst({
      where: { id: data.eventInputId },
      select: { id: true }
    });
    if (!eventInput) return;

    try {
      await slateTriggerReceiverService.processTriggerEventInput({
        eventInputId: eventInput.id
      });
    } catch (error) {
      console.error('Failed to process trigger event input:', error);
      throw new QueueRetryError();
    }
  }
);
