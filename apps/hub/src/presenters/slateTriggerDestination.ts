import type { SlateTriggerDestination } from '../../prisma/generated/client';

export let slateTriggerDestinationPresenter = (destination: SlateTriggerDestination) => ({
  object: 'slate.trigger.destination',

  id: destination.id,
  name: destination.name,
  description: destination.description,

  type: destination.type,
  url: destination.url,
  method: destination.method,
  eventTypes: destination.eventTypes,
  retry: destination.retry,

  signalDestinationId: destination.signalDestinationId,
  signalWebhookId: destination.signalWebhookId,
  signalSigningSecret: destination.signalSigningSecret,

  createdAt: destination.createdAt,
  updatedAt: destination.updatedAt
});
