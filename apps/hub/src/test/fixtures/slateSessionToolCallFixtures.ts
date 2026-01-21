import type {
  SlateSessionToolCall,
  SlateSession,
  SlateAction,
  SlateInvocation,
  Slate,
  SlateInstance,
  SlateVersion,
  SlateSpecification,
  Tenant
} from '../../../prisma/generated/client';
import { SlateSessionToolCallStatus, type SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateSessionFixtures } from './slateSessionFixtures';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';
import { SlateInvocationFixtures, SlateInvocationStorageBucketFixtures } from './invocationFixtures';
import { DeploymentProviderFixtures, SlateDeploymentFixtures } from './deploymentFixtures';

export class SlateSessionToolCallFixtures extends BaseFixture {
  async default(data: {
    sessionOid: bigint;
    actionOid: bigint;
    invocationOid: bigint;
    versionOid: bigint;
    status?: SlateSessionToolCallStatus;
    overrides?: Partial<SlateSessionToolCall>;
  }): Promise<SlateSessionToolCall> {
    const { oid, id } = getId('slateToolCall');

    return this.db.slateSessionToolCall.create({
      data: {
        oid,
        id,
        status: data.status ?? SlateSessionToolCallStatus.succeeded,
        sessionOid: data.sessionOid,
        actionOid: data.actionOid,
        invocationOid: data.invocationOid,
        slateVersionOid: data.versionOid,
        ...data.overrides
      }
    });
  }

  async forGetMany(data: {
    sessionOid: bigint;
    actionOid: bigint;
    deploymentOid: bigint;
    bucketOid: number;
    versionOid: bigint;
  }): Promise<SlateSessionToolCall> {
    const invocationFixtures = new SlateInvocationFixtures(this.db);
    const invocation = await invocationFixtures.default({
      deploymentOid: data.deploymentOid,
      bucketOid: data.bucketOid
    });
    return this.default({
      sessionOid: data.sessionOid,
      actionOid: data.actionOid,
      invocationOid: invocation.oid,
      versionOid: data.versionOid
    });
  }

  async complete(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    status?: SlateSessionToolCallStatus;
    toolCallOverrides?: Partial<SlateSessionToolCall>;
    /**
     * When true, creates invocation with isPending: false and stores mock data
     * in object storage. Required for tests that use the logs presenter.
     */
    withLogs?: boolean;
  }): Promise<{
    toolCall: SlateSessionToolCall;
    session: SlateSession;
    action: SlateAction;
    invocation: SlateInvocation;
    slate: Slate & { currentVersion: SlateVersion & { specification: SlateSpecification } };
    instance: SlateInstance;
    version: SlateVersion & { specification: SlateSpecification };
    tenant: Tenant;
  }> {
    const sessionFixtures = new SlateSessionFixtures(this.db);
    const { session, slate, instance, version, tenant } = await sessionFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus
    });

    const specFixtures = new SlateSpecificationFixtures(this.db);
    const action = await specFixtures.createAction({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid,
      type: 'tool'
    });

    const providerFixtures = new DeploymentProviderFixtures(this.db);
    const provider = await providerFixtures.default();

    const deploymentFixtures = new SlateDeploymentFixtures(this.db);
    const deployment = await deploymentFixtures.default({
      slateOid: slate.oid,
      slateVersionOid: version.oid,
      providerOid: provider.oid
    });

    const bucketFixtures = new SlateInvocationStorageBucketFixtures(this.db);
    const bucket = await bucketFixtures.default();

    const invocationFixtures = new SlateInvocationFixtures(this.db);
    const invocation = data?.withLogs
      ? await invocationFixtures.succeeded({
          deploymentOid: deployment.oid
        })
      : await invocationFixtures.default({
          deploymentOid: deployment.oid,
          bucketOid: bucket.oid
        });

    const toolCall = await this.default({
      sessionOid: session.oid,
      actionOid: action.oid,
      invocationOid: invocation.oid,
      versionOid: version.oid,
      status: data?.status,
      overrides: data?.toolCallOverrides
    });

    return { toolCall, session, action, invocation, slate, instance, version, tenant };
  }
}
