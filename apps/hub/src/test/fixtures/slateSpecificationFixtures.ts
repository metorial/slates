import { randomBytes } from 'crypto';
import type {
  SlateSpecification,
  SlateAction,
  SlateSpecificationAction
} from '../../../prisma/generated/client';
import { getId, snowflake } from '../../id';
import { BaseFixture } from './base';

export class SlateSpecificationFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    versionOid: bigint;
    identifier?: string;
    overrides?: Partial<SlateSpecification>;
  }): Promise<SlateSpecification> {
    const { oid, id } = getId('slateSpecification');
    const identifier = data.identifier || `spec-${randomBytes(4).toString('hex')}`;

    return this.db.slateSpecification.create({
      data: {
        oid,
        id,
        identifier,
        hash: randomBytes(16).toString('hex'),
        name: 'Test Spec',
        key: 'test-spec',
        protocolVersion: '1.0',
        providerInfo: { type: 'provider' as const, id: 'test-provider', name: 'Test Provider' },
        configSchema: {},
        authMethods: [],
        actions: [],
        slateOid: data.slateOid,
        mostRecentVersionOid: data.versionOid,
        ...data.overrides
      }
    });
  }

  async createAction(data: {
    slateOid: bigint;
    specificationOid: bigint;
    type?: 'tool' | 'trigger';
    identifier?: string;
    key?: string;
    overrides?: Partial<SlateAction>;
  }): Promise<SlateAction> {
    const { oid, id } = getId('slateAction');
    const type = data.type || 'tool';
    const identifier = data.identifier || `${type}.${randomBytes(4).toString('hex')}`;
    const key = data.key || identifier;

    const baseSpec = {
      id: identifier,
      name: `Test ${type} ${identifier}`,
      inputSchema: {},
      outputSchema: {},
      capabilities: {}
    };

    const spec =
      type === 'trigger'
        ? {
            ...baseSpec,
            type: 'action.trigger' as const,
            invocation: { type: 'webhook' as const, autoRegistration: false, autoUnregistration: false }
          }
        : {
            ...baseSpec,
            type: 'action.tool' as const
          };

    return this.db.slateAction.create({
      data: {
        oid,
        id,
        type,
        identifier,
        key,
        hash: `hash_${randomBytes(8).toString('hex')}`,
        name: `Test ${type} ${identifier}`,
        spec,
        slateOid: data.slateOid,
        mostRecentSpecificationOid: data.specificationOid,
        ...data.overrides
      }
    });
  }

  async createTriggerAction(data: {
    slateOid: bigint;
    specificationOid: bigint;
    identifier?: string;
    key?: string;
    webhookConfig?: {
      autoRegistration?: boolean;
      autoUnregistration?: boolean;
    };
    overrides?: Partial<SlateAction>;
  }): Promise<SlateAction> {
    const identifier = data.identifier || `trigger.${randomBytes(4).toString('hex')}`;
    const key = data.key || identifier;
    const webhookConfig = data.webhookConfig || {
      autoRegistration: false,
      autoUnregistration: false
    };

    const { oid, id } = getId('slateAction');
    const triggerSpec = {
      id: identifier,
      name: `Test trigger ${identifier}`,
      type: 'action.trigger' as const,
      inputSchema: {},
      outputSchema: {},
      capabilities: {},
      invocation: {
        type: 'webhook' as const,
        autoRegistration: webhookConfig.autoRegistration ?? false,
        autoUnregistration: webhookConfig.autoUnregistration ?? false
      }
    };

    return this.db.slateAction.create({
      data: {
        oid,
        id,
        type: 'trigger',
        identifier,
        key,
        hash: `hash_${randomBytes(8).toString('hex')}`,
        name: `Test trigger ${identifier}`,
        spec: triggerSpec,
        slateOid: data.slateOid,
        mostRecentSpecificationOid: data.specificationOid,
        ...data.overrides
      }
    });
  }

  async linkAction(data: {
    specificationOid: bigint;
    actionOid: bigint;
  }): Promise<SlateSpecificationAction> {
    return this.db.slateSpecificationAction.create({
      data: {
        oid: snowflake.nextId(),
        specificationOid: data.specificationOid,
        actionOid: data.actionOid
      }
    });
  }

  async withTriggerAction(data: {
    slateOid: bigint;
    specificationOid: bigint;
    identifier?: string;
    key?: string;
    webhookConfig?: {
      autoRegistration?: boolean;
      autoUnregistration?: boolean;
    };
    actionOverrides?: Partial<SlateAction>;
  }): Promise<SlateAction> {
    const action = await this.createTriggerAction({
      slateOid: data.slateOid,
      specificationOid: data.specificationOid,
      identifier: data.identifier,
      key: data.key,
      webhookConfig: data.webhookConfig,
      overrides: data.actionOverrides
    });

    await this.linkAction({
      specificationOid: data.specificationOid,
      actionOid: action.oid
    });

    return action;
  }
}
