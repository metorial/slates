import { badRequestError, ServiceError } from '@lowerdeck/error';
import type {
  Slate,
  SlateAction,
  SlateAuthConfig,
  SlateInstance,
  SlateInstanceConfig,
  SlateSharedTriggerConfig,
  SlateSharedTriggerConfigDestination,
  SlateSharedTriggerConfigTrigger,
  SlateTriggerDestination,
  SlateTriggerReceiver,
  SlateTriggerReceiverDestination,
  SlateTriggerReceiverTrigger,
  SlateTriggerReceiverTriggerSource,
  Tenant
} from '../../prisma/generated/client';

export let normalizeEventTypes = (eventTypes?: string[] | null) =>
  eventTypes && eventTypes.length > 0 ? eventTypes : [];

export type TriggerInvocationSpec =
  | {
      type: typeof SlateTriggerReceiverTriggerSource.polling;
      intervalSeconds: number;
    }
  | {
      type: typeof SlateTriggerReceiverTriggerSource.webhook;
      autoRegistration: boolean;
      autoUnregistration: boolean;
    };

export type TriggerActionSpec = {
  type: 'action.trigger';
  invocation: TriggerInvocationSpec;
};

export type ReceiverTriggerWithRelations = SlateTriggerReceiverTrigger & {
  sharedConfigTrigger: SlateSharedTriggerConfigTrigger | null;
  action: SlateAction;
  receiver: SlateTriggerReceiver & {
    tenant: Tenant;
    slate: Slate;
    slateInstance: SlateInstance & {
      currentConfig: SlateInstanceConfig | null;
    };
    destinations: (SlateTriggerReceiverDestination & {
      destination: SlateTriggerDestination;
    })[];
    sharedConfig:
      | (SlateSharedTriggerConfig & {
          destinations: (SlateSharedTriggerConfigDestination & {
            destination: SlateTriggerDestination;
          })[];
        })
      | null;
    authConfig: SlateAuthConfig | null;
  };
};

export let receiverInclude = {
  tenant: true,
  slate: true,
  slateInstance: {
    include: {
      currentConfig: true
    }
  },
  destinations: {
    include: {
      destination: true
    }
  },
  sharedConfig: {
    include: {
      destinations: {
        include: {
          destination: true
        }
      }
    }
  },
  triggers: {
    include: {
      action: true
    }
  },
  authConfig: true
};

export let receiverTriggerInclude = {
  action: true,
  sharedConfigTrigger: true,
  receiver: {
    include: receiverInclude
  }
};

export let getTriggerSpec = (action: SlateAction): TriggerActionSpec => {
  let spec = action.spec as TriggerActionSpec;
  if (!spec || spec.type !== 'action.trigger' || !spec.invocation) {
    throw new ServiceError(
      badRequestError({
        code: 'invalid_trigger_action',
        message: `Action ${action.id} is not a trigger.`
      })
    );
  }

  return spec;
};

export let buildInvocationAuth = (auth: {
  output?: Record<string, any> | null;
  input?: Record<string, any> | null;
  authMethod: { key: string };
}) => ({
  authenticationMethodId: auth.authMethod.key,
  data: auth.output ?? auth.input ?? {}
});
