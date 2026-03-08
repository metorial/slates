import type {
  SlateAction,
  SlateInvocation,
  SlateSharedTriggerConfig,
  SlateTriggerEvent,
  SlateTriggerReceiver,
  SlateTriggerReceiverTrigger,
  SlateSharedTriggerConfigTrigger
} from '../../prisma/generated/client';

export let slateTriggerEventPresenter = (
  event: SlateTriggerEvent & {
    receiver: SlateTriggerReceiver & {
      sharedConfig: SlateSharedTriggerConfig | null;
    };
    receiverTrigger: SlateTriggerReceiverTrigger & {
      sharedConfigTrigger: SlateSharedTriggerConfigTrigger | null;
    };
    action: SlateAction;
    invocation: SlateInvocation;
  }
) => ({
  object: 'slate.trigger.event',

  id: event.id,
  type: event.type,
  sourceId: event.sourceId,

  triggerReceiverId: event.receiver.id,
  triggerReceiverTriggerId: event.receiverTrigger.id,
  triggerBindingId: event.receiverTrigger.id,
  sharedTriggerConfigId: event.receiver.sharedConfig?.id ?? null,
  sharedTriggerConfigTriggerId: event.receiverTrigger.sharedConfigTrigger?.id ?? null,
  triggerId: event.action.id,
  triggerKey: event.action.key,

  input: event.input,
  output: event.output,

  deliveryStatus: event.deliveryStatus,
  signalEventId: event.signalEventId,
  invocationId: event.invocation.id,

  createdAt: event.createdAt
});
