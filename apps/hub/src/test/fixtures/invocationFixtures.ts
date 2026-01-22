import { randomBytes } from 'crypto';
import type {
  SlateInvocationStorageBucket,
  SlateInvocation
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { storage } from '../../storage';
import { env } from '../../env';
import { getStoredInvocationStorageKey } from '../../lib/invocation/store';
import type { StoredSlateInvocation } from '../../lib/invocation/types';
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
    bucketOid?: number;
    providerInvocationId?: string;
    overrides?: Partial<SlateInvocation>;
  }): Promise<SlateInvocation> {
    // Get or create the invocations bucket using upsert with race condition handling
    // Prisma's upsert isn't truly atomic in PostgreSQL, so concurrent calls can still race
    const bucketName = env.storage.INVOCATIONS_BUCKET_NAME;
    let testBucket: SlateInvocationStorageBucket;
    try {
      testBucket = await this.db.slateInvocationStorageBucket.upsert({
        where: { bucket: bucketName },
        update: {},
        create: {
          oid: Math.floor(Math.random() * 1_000_000),
          bucket: bucketName
        }
      });
    } catch (err: any) {
      // Handle race condition - another concurrent call may have created it
      if (err.code === 'P2002') {
        testBucket = await this.db.slateInvocationStorageBucket.findFirstOrThrow({
          where: { bucket: bucketName }
        });
      } else {
        throw err;
      }
    }

    const invocation = await this.default({
      deploymentOid: data.deploymentOid,
      bucketOid: data.bucketOid ?? testBucket.oid,
      providerInvocationId: data.providerInvocationId,
      overrides: {
        isPending: false,
        hasResponseError: false,
        hasInvocationError: false,
        ...data.overrides
      }
    });

    // Store mock invocation data in object storage so presenter can fetch it
    const mockStoredInvocation: StoredSlateInvocation = {
      id: invocation.id,
      requests: [],
      responses: [],
      logs: [[Date.now(), 'Test invocation completed']],
      provider: {
        object: 'function.invocation',
        id: invocation.providerInvocationId,
        status: 'succeeded',
        functionVersionId: 'test-function-version',
        billedTimeMs: 100,
        computeTimeMs: 50,
        error: null,
        createdAt: new Date()
      }
    };

    await storage.putObject(
      bucketName,
      getStoredInvocationStorageKey(invocation),
      JSON.stringify(mockStoredInvocation)
    );

    return invocation;
  }
}
