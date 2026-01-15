import { env } from '../env';

export let getTriggerWebhookBaseUrl = (receiverTriggerId: string) => {
  let base = env.service.SERVICE_PUBLIC_URL.replace(/\/$/, '');
  return `${base}/slates-hub/triggers/webhook/${receiverTriggerId}`;
};
