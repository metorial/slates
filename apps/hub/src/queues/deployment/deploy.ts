import { createCron } from '@lowerdeck/cron';
import { generateCode } from '@lowerdeck/id';
import { createLock } from '@lowerdeck/lock';
import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import { subDays } from 'date-fns';
import unzipper from 'unzipper';
import { db } from '../../db';
import { env } from '../../env';
import { functionBay, functionBayProvider, functionBayTenant } from '../../functionBay';
import { getId } from '../../id';
import { getRegistryClient } from '../../registry';
import { discoverSlateQueue } from '../discovery/discover';

export let deploySlateVersionQueue = createQueue<{ versionId: string }>({
  name: 'shub/slv/dep/init',
  redisUrl: env.service.REDIS_URL,
  workerOpts: {
    concurrency: 1
  }
});

export let deploySlateVersionQueueProcessor = deploySlateVersionQueue.process(async data => {
  let version = await db.slateVersion.findUnique({
    where: { id: data.versionId }
  });
  if (!version) throw new QueueRetryError();

  let deployment = await db.slateDeployment.create({
    data: {
      ...getId('slateDeployment'),
      status: 'pending',

      slateVersionOid: version.oid,
      slateOid: version.slateOid,
      providerOid: functionBayProvider.oid,

      providerDeploymentInfo: null
    }
  });

  await db.slateVersion.update({
    where: { oid: version.oid },
    data: { status: 'deploying' }
  });

  await db.slateEvent.create({
    data: {
      ...getId('slateEvent'),
      type: 'deployment_started',
      message: `Deployment for version ${version.version} started`,
      slateOid: version.slateOid,
      slateVersionOid: version.oid
    }
  });

  console.log(`Starting deployment for slate version ${version.id} (${version.version})`);

  await deploySlateVersionStartQueue.add({ deploymentId: deployment.id });
});

let deploySlateVersionStartQueue = createQueue<{ deploymentId: string }>({
  name: 'shub/slv/dep/start',
  redisUrl: env.service.REDIS_URL,
  workerOpts: { concurrency: 1 }
});

export let deploySlateVersionStartQueueProcessor = deploySlateVersionStartQueue.process(
  async data => {
    let deployment = await db.slateDeployment.findUnique({
      where: { id: data.deploymentId },
      include: {
        slateVersion: true,
        slate: { include: { registry: true } }
      }
    });
    if (!deployment) throw new QueueRetryError();

    let version = deployment.slateVersion;
    let slate = deployment.slate;

    let reg = await getRegistryClient(slate.registry);
    let zipRes = await reg.slates[':scopeId'][':slateId'].versions[':versionId'].download.$get(
      {
        param: {
          scopeId: slate.slateScopeIdentifierOnRegistry,
          slateId: slate.slateIdentifierOnRegistry,
          versionId: version.version
        }
      }
    );
    if ((zipRes.status as any) != 200) throw new Error('Failed to download slate version zip');
    let zipBuffer = await zipRes.arrayBuffer();

    let directory = await unzipper.Open.buffer(Buffer.from(zipBuffer));

    let func = await functionBay.function.upsert({
      identifier: `slates::slate_version::${version.id}::${generateCode(6)}`,
      name: `Slate Version ${version.id} Deployment`,
      tenantId: functionBayTenant.id
    });

    let initialFiles = [
      {
        filename: 'package.json',
        content: JSON.stringify(
          {
            name: 'slate-version-function',
            version: '1.0.0',
            main: 'slates_entry_point.js',
            dependencies: {
              '@slates/provider-handler': 'latest',
              '@slates/proto': 'latest',
              slates: 'latest',
              '@lowerdeck/serialize': 'latest'
            }
          },
          null,
          2
        )
      },
      {
        filename: 'slates_entry_point.js',
        content: `
          import { provider } from './index';
          import { createProviderHandler } from '@slates/provider-handler';
          import { SlatesProviderProtoHandlerManager } from '@slates/proto';
          import { serialize } from '@lowerdeck/serialize';

          let handler = createProviderHandler(provider, [
            e => e.forEach(e => console.log(e.type.toUpperCase(), e.message))
          ]);

          let initialGlobals = {}
          for (let key of Object.getOwnPropertyNames(globalThis)) {
            initialGlobals[key] = globalThis[key]
          }

          let reset = () => {
            for (let key of Object.getOwnPropertyNames(globalThis)) {
              if (!(key in initialGlobals)) {
                try {
                  delete globalThis[key];
                } catch {}
              }
            }

            for (let key in initialGlobals) {
              try {
                globalThis[key] = initialGlobals[key];
              } catch {}
            }

            for (let key in require.cache) {
              try {
                delete require.cache[key];
              } catch {}
            }
          }

          export default async (input) => {
            reset();

            if (input._encoded) {
              input = serialize.decode(input._encoded);
            }

            let manager = await handler.run();

            let messages = [];

            for (let m of input.messages) {
              console.log('[Slates:] Processing input message', m.method + (m.id ? \`(\${m.id})\` : ''));
              let result = await SlatesProviderProtoHandlerManager.handleInput(manager, m);
              if (result) {
                if (m.id) result.id = m.id;
                messages.push(result);

                if (typeof result.error == 'object' && result.error) {
                  console.error('[Slates:] Error in processing:', result.error);
                  break;
                }
              }
            }

            if (input._encoded) {
              return { _encoded: serialize.encode({ messages }) };
            }

            return { messages };
          };
        `
      }
    ];
    let initialFilenames = new Set(initialFiles.map(f => f.filename));

    let functionDeployment = await functionBay.functionDeployment.create({
      functionId: func.id,
      tenantId: functionBayTenant.id,
      name: `Deployment for Slate Version ${version.id}`,
      runtime: {
        identifier: 'nodejs',
        version: '24.x'
      },
      config: {
        memorySizeMb: env.functionBay.FUNCTION_BAY_DEFAULT_MEMORY_MB,
        timeoutSeconds: env.functionBay.FUNCTION_BAY_DEFAULT_TIMEOUT_SECONDS
      },
      env: {},
      files: [
        ...initialFiles,

        ...(await Promise.all(
          directory.files.map(async f => ({
            filename: initialFilenames.has(f.path) ? `_${f.path}` : f.path,
            content: (await f.buffer()).toString('base64'),
            encoding: 'base64' as const
          }))
        ))
      ]
    });

    await db.slateDeployment.update({
      where: { id: deployment.id },
      data: {
        providerDeploymentInfo: {
          functionId: func.id,
          functionDeploymentId: functionDeployment.id
        }
      }
    });

    await deploySlateVersionMonitorQueue.add({
      deploymentId: deployment.id,
      functionId: func.id,
      functionDeploymentId: functionDeployment.id
    });
  }
);

let deploySlateVersionMonitorQueue = createQueue<{
  deploymentId: string;
  functionId: string;
  functionDeploymentId: string;
}>({
  name: 'shub/slv/dep/mon',
  redisUrl: env.service.REDIS_URL,
  workerOpts: { concurrency: 5 }
});

export let deploySlateVersionMonitorQueueProcessor = deploySlateVersionMonitorQueue.process(
  async data => {
    let deployment = await db.slateDeployment.findUnique({
      where: { id: data.deploymentId }
    });
    if (!deployment) throw new QueueRetryError();

    let funcDep = await functionBay.functionDeployment.get({
      functionId: data.functionId,
      tenantId: functionBayTenant.id,
      functionDeploymentId: data.functionDeploymentId
    });

    if (funcDep.status == 'failed' || funcDep.status == 'succeeded') {
      await deploySlateVersionProviderCompletedQueue.add({
        deploymentId: data.deploymentId,
        functionId: data.functionId,
        functionDeploymentId: data.functionDeploymentId
      });
      return;
    }

    if (funcDep.status != deployment.status) {
      await db.slateDeployment.update({
        where: { id: deployment.id },
        data: { status: funcDep.status }
      });
    }

    await deploySlateVersionMonitorQueue.add(data, { delay: 2500 });
  }
);

let deploySlateVersionProviderCompletedQueue = createQueue<{
  deploymentId: string;
  functionId: string;
  functionDeploymentId: string;
}>({
  name: 'shub/slv/dep/pcomp',
  redisUrl: env.service.REDIS_URL,
  workerOpts: { concurrency: 1 }
});

export let deploySlateVersionProviderCompletedQueueProcessor =
  deploySlateVersionProviderCompletedQueue.process(async data => {
    let deployment = await db.slateDeployment.findUnique({
      where: { id: data.deploymentId }
    });
    if (!deployment) throw new QueueRetryError();

    let funcDep = await functionBay.functionDeployment.get({
      functionId: data.functionId,
      tenantId: functionBayTenant.id,
      functionDeploymentId: data.functionDeploymentId
    });

    if (funcDep.status == 'succeeded') {
      await deploySlateVersionCompletedQueue.add({
        deploymentId: data.deploymentId,
        functionId: data.functionId,
        functionDeploymentId: data.functionDeploymentId
      });
      return;
    }

    await deploySlateVersionFailedQueue.add({
      deploymentId: data.deploymentId,
      errorCode: funcDep.error?.code ?? 'unknown_error',
      errorMessage: funcDep.error?.message ?? 'Unknown error during deployment'
    });
  });

let deploySlateVersionFailedQueue = createQueue<{
  deploymentId: string;
  errorCode: string;
  errorMessage: string;
}>({
  name: 'shub/slv/dep/fail',
  redisUrl: env.service.REDIS_URL,
  workerOpts: { concurrency: 1 }
});

export let deploySlateVersionFailedQueueProcessor = deploySlateVersionFailedQueue.process(
  async data => {
    let deployment = await db.slateDeployment.findUnique({
      where: { id: data.deploymentId },
      include: { slateVersion: true }
    });
    if (!deployment) throw new QueueRetryError();

    await db.slateDeployment.update({
      where: { id: deployment.id },
      data: {
        status: 'failed',

        errorCode: data.errorCode,
        errorMessage: data.errorMessage
      }
    });

    await db.slateVersion.update({
      where: { oid: deployment.slateVersionOid },
      data: {
        status: 'deployment_failed'
      }
    });

    await db.slateEvent.create({
      data: {
        ...getId('slateEvent'),
        type: 'deployment_failed',
        message: `Deployment for version ${deployment.slateVersion.version} failed: ${data.errorMessage}`,
        slateOid: deployment.slateOid,
        slateVersionOid: deployment.slateVersionOid
      }
    });
  }
);

let deploySlateVersionCompletedQueue = createQueue<{
  deploymentId: string;
  functionId: string;
  functionDeploymentId: string;
}>({
  name: 'shub/slv/dep/comp',
  redisUrl: env.service.REDIS_URL,
  workerOpts: { concurrency: 1 }
});

let publishLock = createLock({
  name: 'shub/slv/dep/publish/lock',
  redisUrl: env.service.REDIS_URL
});

export let deploySlateVersionCompletedQueueProcessor =
  deploySlateVersionCompletedQueue.process(async data => {
    let outerDeployment = await db.slateDeployment.findUnique({
      where: { id: data.deploymentId },
      include: { slate: true }
    });
    if (!outerDeployment) throw new QueueRetryError();

    return publishLock.usingLock(outerDeployment.slate.id, async () => {
      let deployment = await db.slateDeployment.findUniqueOrThrow({
        where: { id: data.deploymentId },
        include: { slateVersion: true, slate: { include: { currentVersion: true } } }
      });
      let slate = deployment.slate;

      let funcDep = await functionBay.functionDeployment.get({
        functionId: data.functionId,
        tenantId: functionBayTenant.id,
        functionDeploymentId: data.functionDeploymentId
      });

      let updatedDeployment = await db.slateDeployment.update({
        where: { id: deployment.id },
        data: {
          status: 'succeeded',

          providerDeploymentInfo: {
            functionId: data.functionId,
            functionDeploymentId: funcDep.id,
            functionVersionId: funcDep.version!.id
          }
        }
      });

      await db.slateVersion.updateMany({
        where: { oid: deployment.slateVersion.oid },
        data: {
          status: 'discovering',
          providerDeploymentInfo: updatedDeployment.providerDeploymentInfo,
          activeDeploymentOid: updatedDeployment.oid
        }
      });

      await db.slateEvent.create({
        data: {
          ...getId('slateEvent'),
          type: 'deployment_succeeded',
          message: `Deployment for version ${deployment.slateVersion.version} succeeded.`,
          slateOid: slate.oid,
          slateVersionOid: deployment.slateVersion.oid
        }
      });

      await discoverSlateQueue.add(
        { versionId: deployment.slateVersion.id },
        { delay: 10_000 }
      );
    });
  });

export let failOldDeploymentsCron = createCron(
  {
    name: 'shub/slv/dep/fail-old',
    redisUrl: env.service.REDIS_URL,
    cron: '0 0 * * *'
  },
  async () => {
    let fiveDaysAgo = subDays(new Date(), 5);

    let oldDeployments = await db.slateDeployment.findMany({
      where: {
        status: 'pending',
        createdAt: { lt: fiveDaysAgo }
      }
    });

    await deploySlateVersionFailedQueue.addMany(
      oldDeployments.map(d => ({
        deploymentId: d.id,
        errorCode: 'deployment_timeout',
        errorMessage: 'Deployment did not complete within 1 hour'
      }))
    );
  }
);
