import { env } from '../env';

export type TriggerWebhookRequestPayload = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: { encoding: 'base64'; content: string } | null;
};

export let getTriggerWebhookBaseUrl = (triggerBindingId: string) => {
  let base = env.service.SERVICE_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/slates-hub/triggers/webhook/${triggerBindingId}`;
};

export let getTriggerWebhookRequestStorageKey = (requestId: string) => {
  return `trigger-webhooks/${requestId}/request`;
};
