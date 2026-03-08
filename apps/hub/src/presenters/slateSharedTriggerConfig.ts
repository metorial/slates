import type {
  Slate,
  SlateAction,
  SlateSharedTriggerConfig,
  SlateSharedTriggerConfigDestination,
  SlateSharedTriggerConfigTrigger,
  SlateTriggerDestination
} from '../../prisma/generated/client';

export let slateSharedTriggerConfigPresenter = (
  config: SlateSharedTriggerConfig & {
    slate: Slate;
    destinations: (SlateSharedTriggerConfigDestination & {
      destination: SlateTriggerDestination;
    })[];
    triggers: (SlateSharedTriggerConfigTrigger & {
      action: SlateAction;
    })[];
  }
) => ({
  object: 'slate.shared_trigger_config',

  id: config.id,
  slateId: config.slate.id,
  status: config.status,
  name: config.name,
  description: config.description,

  destinations: config.destinations.map(dest => ({
    object: 'slate.trigger.destination',
    id: dest.destination.id,
    name: dest.destination.name,
    url: dest.destination.url,
    method: dest.destination.method
  })),

  triggers: config.triggers.map(trigger => ({
    object: 'slate.shared_trigger_config.trigger',
    id: trigger.id,
    triggerId: trigger.action.id,
    triggerKey: trigger.action.key,
    triggerName: trigger.action.name,
    eventTypes: trigger.eventTypes,
    pollIntervalSecondsOverride: trigger.pollIntervalSecondsOverride,
    createdAt: trigger.createdAt,
    updatedAt: trigger.updatedAt
  })),

  createdAt: config.createdAt,
  updatedAt: config.updatedAt
});
