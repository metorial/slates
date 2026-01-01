import { generateCode } from '@lowerdeck/id';
import { createLock } from '@lowerdeck/lock';
import { createQueue } from '@lowerdeck/queue';
import { db } from '../../db';
import { env } from '../../env';
import { ID, snowflake } from '../../id';
import { getRegistryClient } from '../../registry';
import { deploySlateVersionQueue } from '../deployment/deploy';

export let syncSlateQueue = createQueue<{
  id: string;
  version?: string;
  registryId: string;
}>({
  name: 'shub/slate/sync',
  redisUrl: env.service.REDIS_URL
});

let lock = createLock({
  name: 'shub/slate/sync/lock',
  redisUrl: env.service.REDIS_URL
});

export let syncSlateQueueProcessor = syncSlateQueue.process(data =>
  lock.usingLock(data.id, async () => {
    let reg = await db.registry.findUnique({
      where: { id: data.registryId }
    });
    if (!reg) return;

    let client = await getRegistryClient(reg);

    let [scopeId, slateId] = data.id.split('/');
    let slateRes = await client.slates[':scopeId'][':slateId'].$get({
      param: {
        scopeId: scopeId!,
        slateId: slateId!
      }
    });
    if (slateRes.status !== 200) throw new Error('Failed to fetch slate');

    let slateData = await slateRes.json();

    let slateUpsertData = {
      name: slateData.name,
      description: slateData.description,

      slateIdOnRegistry: slateData.id,
      slateIdentifierOnRegistry: slateData.identifier,
      slateFullIdentifierOnRegistry: slateData.fullIdentifier,

      slateScopeIdOnRegistry: slateData.scope.id,
      slateScopeIdentifierOnRegistry: slateData.scope.identifier
    };

    let slate = await db.slate.upsert({
      where: {
        registryOid_slateFullIdentifierOnRegistry: {
          registryOid: reg.oid,
          slateFullIdentifierOnRegistry: slateData.fullIdentifier
        }
      },
      create: {
        oid: snowflake.nextId(),
        id: await ID.generateId('slate'),
        status: 'active',

        registryOid: reg.oid,
        identifier: `slate::${reg.id}::${slateData.fullIdentifier}::${generateCode(6)}`,

        ...slateUpsertData
      },
      update: slateUpsertData
    });

    if (data.version) {
      let slateVersionRes = await client.slates[':scopeId'][':slateId'].versions[
        ':versionId'
      ].$get({
        param: {
          scopeId: scopeId!,
          slateId: slateId!,
          versionId: data.version
        }
      });
      if (slateVersionRes.status !== 200) throw new Error('Failed to fetch slate version');

      let slateVersionData = await slateVersionRes.json();

      let slateVersionUpsertData = {
        version: slateVersionData.version,
        manifest: slateVersionData.manifest,
        versionIdOnRegistry: slateVersionData.id,
        versionIdentifierOnRegistry: slateVersionData.version
      };

      let version = await db.slateVersion.upsert({
        where: {
          slateOid_version: {
            slateOid: slate.oid,
            version: slateVersionData.version
          }
        },
        create: {
          oid: snowflake.nextId(),
          id: await ID.generateId('slateVersion'),
          slateOid: slate.oid,
          registryOid: reg.oid,

          status: 'upcoming',
          isCurrent: false,
          willBeCurrent: slateVersionData.isCurrent,

          info: null,

          ...slateVersionUpsertData
        },
        update: slateVersionUpsertData
      });

      await deploySlateVersionQueue.add({ versionId: version.id }, { id: version.id });
    }
  })
);
