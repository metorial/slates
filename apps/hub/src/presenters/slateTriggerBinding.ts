import { SlateTriggerReceiverTriggerSource, type SlateAction, type SlateAuthConfig, type SlateInstance, type SlateSharedTriggerConfig, type SlateSharedTriggerConfigTrigger, type SlateTriggerReceiver, type SlateTriggerReceiverTrigger } from '../../prisma/generated/client';
import { getTriggerWebhookBaseUrl } from '../lib/triggerWebhook';
import { getEffectiveTriggerBindingPollIntervalSeconds } from '../services/slateTriggerReceiverShared';

export let slateTriggerBindingPresenter = (
  trigger: SlateTriggerReceiverTrigger & {
    action: SlateAction;
    sharedConfigTrigger: SlateSharedTriggerConfigTrigger | null;
    receiver: SlateTriggerReceiver & {
      slateInstance: SlateInstance;
      authConfig: SlateAuthConfig | null;
      sharedConfig: SlateSharedTriggerConfig | null;
    };
  }
) => ({
  object: 'slate.trigger.binding',

  id: trigger.id,
  sharedTriggerConfigId: trigger.receiver.sharedConfig?.id ?? null,
  sharedTriggerConfigTriggerId: trigger.sharedConfigTrigger?.id ?? null,
  slateInstanceId: trigger.receiver.slateInstance.id,
  authConfigId: trigger.receiver.authConfig?.id ?? null,
  externalKey: trigger.receiver.externalKey ?? null,

  status: trigger.receiver.status,
  consecutivePollingFailures: trigger.receiver.consecutivePollingFailures,
  consecutiveEventFailures: trigger.receiver.consecutiveEventFailures,

  triggerId: trigger.action.id,
  triggerKey: trigger.action.key,
  triggerName: trigger.action.name,
  source: trigger.source,
  pollIntervalSeconds: getEffectiveTriggerBindingPollIntervalSeconds(trigger),
  nextPollAt: trigger.nextPollAt,
  lastPolledAt: trigger.lastPolledAt,

  webhookUrl:
    trigger.source === SlateTriggerReceiverTriggerSource.webhook
      ? getTriggerWebhookBaseUrl(trigger.id)
      : null,
  isWebhookRegistered:
    trigger.source === SlateTriggerReceiverTriggerSource.webhook
      ? !!trigger.registrationDetails
      : null,

  createdAt: trigger.createdAt,
  updatedAt: trigger.updatedAt
});
