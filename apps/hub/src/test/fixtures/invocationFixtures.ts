import { randomBytes } from 'crypto';
import type {
  SlateInvocationStorageBucket,
  SlateInvocation
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class SlateInvocationStorageBucketFixtures extends BaseFixture {
  async default(bucket?: string): Promise<SlateInvocationStorageBucket> {
    const bucketName = bucket || `bucket-${randomBytes(4).toString('hex')}`;

    return this.db.slateInvocationStorageBucket.upsert({
      where: { bucket: bucketName },
      update: {},
      create: {
        oid: Math.floor(Math.random() * 1_000_000),
        bucket: bucketName
      }
    });
  }
}

export class SlateInvocationFixtures extends BaseFixture {
  async default(data: {
    deploymentOid: bigint;
    bucketOid: number;
    providerInvocationId?: string;
    overrides?: Partial<SlateInvocation>;
  }): Promise<SlateInvocation> {
    const { oid, id } = getId('slateInvocation');
    const providerInvocationId =
      data.providerInvocationId || `inv_${randomBytes(4).toString('hex')}`;

    return this.db.slateInvocation.create({
      data: {
        oid,
        id,
        isPending: true,
        hasResponseError: false,
        hasInvocationError: false,
        providerInvocationId,
        deploymentOid: data.deploymentOid,
        bucketOid: data.bucketOid,
        ...data.overrides
      }
    });
  }

  async succeeded(data: {
    deploymentOid: bigint;
    bucketOid: number;
    providerInvocationId?: string;
    overrides?: Partial<SlateInvocation>;
  }): Promise<SlateInvocation> {
    return this.default({
      deploymentOid: data.deploymentOid,
      bucketOid: data.bucketOid,
      providerInvocationId: data.providerInvocationId,
      overrides: {
        isPending: false,
        hasResponseError: false,
        hasInvocationError: false,
        ...data.overrides
      }
    });
  }
}
