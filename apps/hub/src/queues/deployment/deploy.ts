import { generateCode } from '@lowerdeck/id';
import { createLock } from '@lowerdeck/lock';
import { createQueue, QueueRetryError } from '@lowerdeck/queue';
import semver from 'semver';
import unzipper from 'unzipper';
import { db } from '../../db';
import { env } from '../../env';
import { functionBay, functionBayProvider, functionBayTenant } from '../../functionBay';
import { ID, snowflake } from '../../id';
import { getRegistryClient } from '../../registry';

export let deploySlateVersionQueue = createQueue<{ versionId: string }>({
  name: 'shub/slv/dep/init',
  redisUrl: env.service.REDIS_URL
});

export let deploySlateVersionQueueProcessor = deploySlateVersionQueue.process(async data => {
  let version = await db.slateVersion.findUnique({
    where: { id: data.versionId }
  });
  if (!version) throw new QueueRetryError();

  let deployment = await db.slateDeployment.create({
    data: {
      oid: snowflake.nextId(),
      id: await ID.generateId('slateDeployment'),
      status: 'pending',

      slateVersionOid: version.oid,
      slateOid: version.slateOid,
      providerOid: functionBayProvider.oid,

      providerDeploymentInfo: null
    }
  });

  await deploySlateVersionStartQueue.add({ deploymentId: deployment.id });
});

let deploySlateVersionStartQueue = createQueue<{ deploymentId: string }>({
  name: 'shub/slv/dep/start',
  redisUrl: env.service.REDIS_URL
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
              '@slates/provider-handler': '1.0.0-rc.2',
              '@slates/proto': '1.0.0-rc.2',
              slates: '1.0.0-rc.2'
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

          let handler = (provider, [
            e => e.forEach(e => console.log(e.type.toUpperCase(), e.message))
          ]);

          export default async (input) => {
            let manager = await handler.run();

            let messages = await input.messages.map(m => {
              console.log('RUNTIME processing input message', m.method + (m.id ? \`(\${m.id})\` : ''));
              return manager.handleInput(m);
            });

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
  redisUrl: env.service.REDIS_URL
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
  redisUrl: env.service.REDIS_URL
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

    await db.slateDeployment.update({
      where: { id: deployment.id },
      data: {
        status: 'failed',

        errorCode: funcDep.error?.code,
        errorMessage: funcDep.error?.message
      }
    });

    await db.slateVersion.update({
      where: { oid: deployment.slateVersionOid },
      data: {
        status: 'deployment_failed'
      }
    });
  });

let deploySlateVersionCompletedQueue = createQueue<{
  deploymentId: string;
  functionId: string;
  functionDeploymentId: string;
}>({
  name: 'shub/slv/dep/comp',
  redisUrl: env.service.REDIS_URL
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

      if (
        deployment.slateVersion.willBeCurrent &&
        (!slate.currentVersion ||
          semver.gt(deployment.slateVersion.version, slate.currentVersion.version))
      ) {
        await db.$transaction(async db => {
          await db.slate.update({
            where: { id: slate.id },
            data: {
              currentVersionOid: deployment.slateVersion.oid
            }
          });

          await db.slateVersion.updateMany({
            where: {
              slateOid: slate.oid,
              oid: { not: deployment.slateVersion.oid }
            },
            data: {
              isCurrent: false
            }
          });

          await db.slateVersion.update({
            where: { oid: deployment.slateVersion.oid },
            data: {
              status: 'active',
              isCurrent: true,
              providerDeploymentInfo: updatedDeployment.providerDeploymentInfo
            }
          });
        });
      }
    });
  });
