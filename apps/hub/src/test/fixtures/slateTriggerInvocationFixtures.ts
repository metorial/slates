import type {
  SlateTriggerInvocation,
  SlateTriggerReceiver,
  SlateTriggerReceiverTrigger,
  SlateAction,
  Slate,
  SlateInstance,
  SlateVersion,
  SlateSpecification,
  SlateInvocation,
  Tenant
} from '../../../prisma/generated/client';
import { SlateTriggerInvocationType } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateTriggerReceiverFixtures } from './slateTriggerReceiverFixtures';
import { SlateInvocationFixtures } from './invocationFixtures';
import { DeploymentProviderFixtures, SlateDeploymentFixtures } from './deploymentFixtures';

export class SlateTriggerInvocationFixtures extends BaseFixture {
  async default(data: {
    receiverOid: bigint;
    invocationOid: bigint;
    receiverTriggerOid?: bigint;
    type?: SlateTriggerInvocationType;
    overrides?: Partial<SlateTriggerInvocation>;
  }): Promise<SlateTriggerInvocation> {
    const { oid, id } = getId('slateTriggerInvocation');

    return this.db.slateTriggerInvocation.create({
      data: {
        oid,
        id,
        type: data.type ?? SlateTriggerInvocationType.poll,
        receiverOid: data.receiverOid,
        receiverTriggerOid: data.receiverTriggerOid,
        invocationOid: data.invocationOid,
        ...data.overrides
      }
    });
  }

  async complete(data?: {
    type?: SlateTriggerInvocationType;
    invocationOverrides?: Partial<SlateTriggerInvocation>;
  }): Promise<{
    triggerInvocation: SlateTriggerInvocation;
    receiver: SlateTriggerReceiver;
    receiverTrigger: SlateTriggerReceiverTrigger;
    triggerAction: SlateAction;
    slate: Slate & { currentVersion: SlateVersion & { specification: SlateSpecification } };
    instance: SlateInstance;
    invocation: SlateInvocation;
    tenant: Tenant;
  }> {
    const receiverFixtures = new SlateTriggerReceiverFixtures(this.db);
    const { receiver, receiverTrigger, triggerAction, slate, instance, tenant } =
      await receiverFixtures.complete();

    const providerFixtures = new DeploymentProviderFixtures(this.db);
    const provider = await providerFixtures.default();

    const deploymentFixtures = new SlateDeploymentFixtures(this.db);
    const deployment = await deploymentFixtures.default({
      slateOid: slate.oid,
      slateVersionOid: slate.currentVersion.oid,
      providerOid: provider.oid
    });

    // Use succeeded() to create invocation with isPending: false and storage data
    // This is required because slateTriggerInvocationPresenter calls slateInvocationLitePresenter
    const invocationFixtures = new SlateInvocationFixtures(this.db);
    const invocation = await invocationFixtures.succeeded({
      deploymentOid: deployment.oid
    });

    const triggerInvocation = await this.default({
      receiverOid: receiver.oid,
      receiverTriggerOid: receiverTrigger.oid,
      invocationOid: invocation.oid,
      type: data?.type,
      overrides: data?.invocationOverrides
    });

    return {
      triggerInvocation,
      receiver,
      receiverTrigger,
      triggerAction,
      slate,
      instance,
      invocation,
      tenant
    };
  }
}
