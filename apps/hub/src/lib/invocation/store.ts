import { delay } from '@lowerdeck/delay';
import PQueue from 'p-queue';
import type { SlateInvocation } from '../../../prisma/generated/client';
import { db } from '../../db';
import { functionBay, functionBayTenant } from '../../functionBay';
import { invocationsBucketRecord, storage } from '../../storage';
import type { SlateInvocationBaseParams, SlatesRequest, SlatesResponse } from './types';

let storeQueue = new PQueue({ concurrency: 25 });

let authFieldsToRedact = [
  'output',
  'input',
  'previousInput',
  'newInput',
  'clientSecret',
  'state'
];

let getFunctionBayInvocationResultWithRetry = async (
  d: SlateInvocationBaseParams & { invocationId: string }
) => {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      return await functionBay.functionInvocation.get({
        tenantId: functionBayTenant.id,
        functionId: d.slateVersion.providerDeploymentInfo!.functionId,
        functionInvocationId: d.invocationId
      });
    } catch (err) {
      if (attempt == 5) throw err;

      console.error(
        `Error fetching function bay invocation result (attempt ${attempt}), retrying...`,
        err
      );
      await delay(200 * attempt);
    }
  }
};

export let storeSlateInvocation = (
  d: SlateInvocationBaseParams & {
    record: SlateInvocation;
    requestMessages: SlatesRequest[];
    responseMessages?: SlatesResponse[];
    invocationResult: Awaited<ReturnType<typeof functionBay.function.invoke>>;
  }
) => {
  storeQueue
    .add(async () => {
      await delay(1000); // Wait for function bay invocation logs to be available

      let idToMethodMap = new Map<string, SlatesRequest['method']>();

      let sanitizedRequests = d.requestMessages.map(m => {
        if ('id' in m && m.id) idToMethodMap.set(m.id, m.method);

        if (m.method.startsWith('slates/auth.')) {
          let updatedParams: any = m.params;

          for (let field of authFieldsToRedact) {
            if (field in m.params) {
              updatedParams[field] = '[REDACTED]';
            }
          }

          return { ...m, params: updatedParams };
        }
      });

      let sanitizedResponses = d.responseMessages?.map(m => {
        if (typeof m != 'object' || m == null) console.log('Non-object response message:', m);

        let method = 'id' in m && m.id ? idToMethodMap.get(m.id) : null;

        if (method && 'result' in m && method.startsWith('slates/auth.')) {
          let updatedResult: any = m.result;

          for (let field of authFieldsToRedact) {
            if (field in m.result) {
              updatedResult[field] = '[REDACTED]';
            }
          }

          return { ...m, result: updatedResult };
        }
      });

      let invocationResult = await getFunctionBayInvocationResultWithRetry({
        slateVersion: d.slateVersion,
        participants: d.participants,
        invocationId: d.invocationResult.id
      });

      let storageKey = `invocations/${d.record.id}/logs`;
      await storage.putObject(
        invocationsBucketRecord.bucket,
        storageKey,
        JSON.stringify({
          id: d.record.id,
          requests: sanitizedRequests,
          responses: sanitizedResponses,
          provider: invocationResult
        })
      );

      await db.slateInvocation.update({
        where: { oid: d.record.oid },
        data: {
          isPending: false,
          providerInvocationId: d.invocationResult.id,
          bucketOid: invocationsBucketRecord.oid
        }
      });
    })
    .catch(console.error);
};
