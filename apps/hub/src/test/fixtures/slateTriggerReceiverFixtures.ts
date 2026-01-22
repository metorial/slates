import { randomBytes } from 'crypto';
import type {
  SlateTriggerReceiver,
  SlateTriggerReceiverTrigger,
  Slate,
  SlateInstance,
  SlateVersion,
  SlateSpecification,
  SlateAction,
  Tenant
} from '../../../prisma/generated/client';
import {
  SlateTriggerReceiverStatus,
  SlateTriggerReceiverTriggerSource,
  SlateStatus
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { TenantFixtures } from './tenantFixtures';
import { SlateFixtures } from './slateFixtures';
import { SlateInstanceFixtures } from './instanceFixtures';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';

export class SlateTriggerReceiverFixtures extends BaseFixture {
  async default(data: {
    tenantOid: bigint;
    slateOid: bigint;
    instanceOid: bigint;
    overrides?: Partial<SlateTriggerReceiver>;
  }): Promise<SlateTriggerReceiver> {
    const { oid, id } = getId('slateTriggerReceiver');

    return this.db.slateTriggerReceiver.create({
      data: {
        oid,
        id,
        tenantOid: data.tenantOid,
        slateOid: data.slateOid,
        slateInstanceOid: data.instanceOid,
        status: SlateTriggerReceiverStatus.active,
        name: `receiver-${randomBytes(4).toString('hex')}`,
        eventTypes: ['*'],
        ...data.overrides
      }
    });
  }

  async createTrigger(data: {
    receiverOid: bigint;
    actionOid: bigint;
    source?: SlateTriggerReceiverTriggerSource;
    overrides?: Partial<SlateTriggerReceiverTrigger>;
  }): Promise<SlateTriggerReceiverTrigger> {
    const { oid, id } = getId('slateTriggerReceiverTrigger');

    return this.db.slateTriggerReceiverTrigger.create({
      data: {
        oid,
        id,
        receiverOid: data.receiverOid,
        actionOid: data.actionOid,
        source: data.source ?? SlateTriggerReceiverTriggerSource.polling,
        pollIntervalSeconds: data.source === SlateTriggerReceiverTriggerSource.polling ? 60 : null,
        state: {},
        registrationDetails: {},
        ...data.overrides
      }
    });
  }

  async withInstance(data: {
    tenantOid: bigint;
    slateOid: bigint;
  }): Promise<SlateTriggerReceiver> {
    const instanceFixtures = new SlateInstanceFixtures(this.db);
    const instance = await instanceFixtures.default({
      slateOid: data.slateOid,
      tenantOid: data.tenantOid
    });
    return this.default({
      tenantOid: data.tenantOid,
      slateOid: data.slateOid,
      instanceOid: instance.oid
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    receiverOverrides?: Partial<SlateTriggerReceiver>;
  }): Promise<{
    receiver: SlateTriggerReceiver;
    receiverTrigger: SlateTriggerReceiverTrigger;
    triggerAction: SlateAction;
    slate: Slate & { currentVersion: SlateVersion & { specification: SlateSpecification } };
    instance: SlateInstance;
    tenant: Tenant;
  }> {
    const tenantFixtures = new TenantFixtures(this.db);
    const tenant = await tenantFixtures.default();

    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const instanceFixtures = new SlateInstanceFixtures(this.db);
    const instance = await instanceFixtures.default({
      slateOid: slate.oid,
      tenantOid: tenant.oid
    });

    const specFixtures = new SlateSpecificationFixtures(this.db);
    const triggerAction = await specFixtures.withTriggerAction({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid
    });

    const receiver = await this.default({
      tenantOid: tenant.oid,
      slateOid: slate.oid,
      instanceOid: instance.oid,
      overrides: data?.receiverOverrides
    });

    const receiverTrigger = await this.createTrigger({
      receiverOid: receiver.oid,
      actionOid: triggerAction.oid
    });

    return { receiver, receiverTrigger, triggerAction, slate, instance, tenant };
  }
}
