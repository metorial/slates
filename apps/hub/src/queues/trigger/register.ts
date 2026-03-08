import { QueueRetryError } from '@lowerdeck/queue';
import { getSentry } from '@lowerdeck/sentry';
import { db } from '../../db';
import { slateTriggerBindingService } from '../../services/slateTriggerBinding';
import {
  slateTriggerWebhookRegisterQueue,
  slateTriggerWebhookUnregisterQueue
} from './eventQueues';

let Sentry = getSentry();

export let slateTriggerWebhookRegisterQueueProcessor =
  slateTriggerWebhookRegisterQueue.process(async data => {
    let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
      where: { id: data.receiverTriggerId },
      select: { id: true }
    });
    if (!receiverTrigger) return;

    try {
      await slateTriggerBindingService.registerWebhookForTriggerBinding({
        triggerBindingId: receiverTrigger.id
      });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { receiverTriggerId: data.receiverTriggerId }
      });
      console.error('Failed to auto-register trigger webhook:', error);
      throw new QueueRetryError();
    }
  });

export let slateTriggerWebhookUnregisterQueueProcessor =
  slateTriggerWebhookUnregisterQueue.process(async data => {
    let receiverTrigger = await db.slateTriggerReceiverTrigger.findFirst({
      where: { id: data.receiverTriggerId },
      select: { id: true }
    });
    if (!receiverTrigger) return;

    try {
      await slateTriggerBindingService.unregisterWebhookForTriggerBinding({
        triggerBindingId: receiverTrigger.id
      });
    } catch (error) {
      Sentry.captureException(error, {
        extra: { receiverTriggerId: data.receiverTriggerId }
      });
      console.error('Failed to auto-unregister trigger webhook:', error);
      throw new QueueRetryError();
    }
  });
