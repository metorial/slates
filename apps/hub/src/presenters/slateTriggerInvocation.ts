import type {
  SlateInvocation,
  SlateTriggerEvent,
  SlateTriggerInvocation,
  SlateSharedTriggerConfig,
  SlateTriggerReceiver,
  SlateTriggerReceiverTrigger,
  SlateSharedTriggerConfigTrigger
} from '../../prisma/generated/client';
import { slateInvocationLitePresenter } from './slateInvocation';

export let slateTriggerInvocationPresenter = async (
  invocation: SlateTriggerInvocation & {
    invocation: SlateInvocation;
    receiver: SlateTriggerReceiver & {
      sharedConfig: SlateSharedTriggerConfig | null;
    };
    receiverTrigger:
      | (SlateTriggerReceiverTrigger & {
          sharedConfigTrigger: SlateSharedTriggerConfigTrigger | null;
        })
      | null;
    event: SlateTriggerEvent | null;
  }
) => ({
  object: 'slate.trigger.invocation',

  id: invocation.id,
  type: invocation.type,

  triggerReceiverId: invocation.receiver.id,
  triggerReceiverTriggerId: invocation.receiverTrigger?.id ?? null,
  triggerBindingId: invocation.receiverTrigger?.id ?? null,
  sharedTriggerConfigId: invocation.receiver.sharedConfig?.id ?? null,
  sharedTriggerConfigTriggerId: invocation.receiverTrigger?.sharedConfigTrigger?.id ?? null,
  triggerEventId: invocation.event?.id ?? null,

  invocation: await slateInvocationLitePresenter(invocation.invocation),

  createdAt: invocation.createdAt
});
