import {
  badRequestError,
  forbiddenError,
  notFoundError,
  preconditionFailedError,
  ServiceError,
  unauthorizedError
} from '@lowerdeck/error';
import { createLock } from '@lowerdeck/lock';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import semver from 'semver';
import unzipper from 'unzipper';
import { type Slate, SlateAccess, type User } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { ID, snowflake } from '../id';
import { storage } from '../storage';

let include = {
  slate: {
    include: {
      scope: true,
      instance: true,
      createdByUser: { include: { scope: true } }
    }
  },
  bundleArtifact: true,
  createdByUser: { include: { scope: true } },
  slateDocuments: true
};

let packageLock = createLock({
  name: 'sreg/slate/pub',
  redisUrl: env.service.REDIS_URL
});

class slateVersionServiceImpl {
  async publishSlateVersion(d: {
    user: User;
    input: {
      scopeIdentifier: string;
      slateIdentifier: string;
      version: string;
      contentBase64: string;
      access: SlateAccess;
    };
  }) {
    return packageLock.usingLock(`${d.input.scopeIdentifier}/${d.input.slateIdentifier}`, () =>
      db.$transaction(async db => {
        let valid = semver.valid(d.input.version);
        if (!valid) {
          throw new ServiceError(
            badRequestError({
              message: `Version ${d.input.version} is not a valid semver version.`
            })
          );
        }
        d.input.version = valid;

        if (d.input.access == 'public' && env.access.PUBLIC_ACCESS_PERMITTED === false) {
          throw new ServiceError(
            forbiddenError({
              message: 'Public access is not permitted on this instance.'
            })
          );
        }

        if (d.user.access !== 'read_write') {
          throw new ServiceError(
            unauthorizedError({
              message: 'User does not have permission to publish slates.'
            })
          );
        }

        let scope = await db.scope.findFirst({
          where: {
            identifier: d.input.scopeIdentifier,
            status: 'active'
          }
        });
        if (!scope) throw new ServiceError(notFoundError('scope'));

        if (scope.instanceOid !== d.user.instanceOid) {
          throw new ServiceError(
            forbiddenError({
              message: 'Cannot publish slates to a scope outside of your instance.'
            })
          );
        }

        let slate = await db.slate.findFirst({
          where: {
            identifier: d.input.slateIdentifier,
            scopeOid: scope.oid,
            instanceOid: d.user.instanceOid
          },
          include: { currentVersion: true }
        });
        if (slate?.status == 'deleted') {
          throw new ServiceError(
            preconditionFailedError({
              message: 'Cannot publish to a slate that has been deleted.'
            })
          );
        }

        if (slate?.currentVersion) {
          if (!semver.gt(d.input.version, slate.currentVersion.version)) {
            throw new ServiceError(
              preconditionFailedError({
                message: `New version ${d.input.version} must be greater than existing version ${slate.currentVersion.version}.`
              })
            );
          }
        }

        if (!slate) {
          slate = await db.slate.create({
            data: {
              oid: snowflake.nextId(),
              id: await ID.generateId('slate'),
              status: 'active',
              access: d.input.access,

              identifier: d.input.slateIdentifier,
              fullIdentifier: `${d.input.scopeIdentifier}/${d.input.slateIdentifier}`,
              name: d.input.slateIdentifier,

              description: null,
              scopeOid: scope.oid,
              instanceOid: d.user.instanceOid,
              createdByUserOid: d.user.oid
            },
            include: { currentVersion: true }
          });
        }

        let storageKey = `slate/${slate.id}/${d.input.version}/bundle.zip`;
        let bucket = env.storage.PACKAGE_BUCKET_NAME;

        let buffer = Buffer.from(d.input.contentBase64, 'base64');

        await storage.putObject(bucket, storageKey, buffer, 'application/zip');

        let artifact = await db.artifact.create({
          data: {
            oid: snowflake.nextId(),
            id: await ID.generateId('artifact'),
            storageKey,
            bucket,
            size: 0,
            mimeType: 'application/zip',
            checksum: ''
          }
        });

        let directory = await unzipper.Open.buffer(
          Buffer.from(d.input.contentBase64, 'base64')
        );
        let docsFiles: {
          path: string;
          content: string;
        }[] = [];

        for (let entry of directory.files) {
          if (entry.type !== 'File') continue;
          if (
            (!entry.path.startsWith(`docs/`) || !entry.path.endsWith('.md')) &&
            entry.path.toLowerCase() !== 'readme.md'
          )
            continue;

          docsFiles.push({
            path: entry.path,
            content: (await entry.buffer()).toString('utf-8')
          });
        }

        await db.slateVersion.updateMany({
          where: { slateOid: slate.oid, isCurrent: true },
          data: { isCurrent: false }
        });

        let version = await db.slateVersion.create({
          data: {
            oid: snowflake.nextId(),
            id: await ID.generateId('slateVersion'),
            version: d.input.version,
            slateOid: slate.oid,
            bundleArtifactOid: artifact.oid,
            createdByUserOid: d.user.oid,
            isCurrent: true
          }
        });

        await db.slateDocument.createMany({
          data: docsFiles.map(f => ({
            oid: snowflake.nextId(),
            id: ID.generateIdSync('slateDocument'),
            slateVersionOid: version.oid,
            path: f.path,
            content: f.content
          }))
        });

        await db.slate.update({
          where: { oid: slate.oid },
          data: {
            currentVersionOid: version.oid,
            access: d.input.access
          }
        });

        return await db.slateVersion.findFirstOrThrow({
          where: { oid: version.oid },
          include
        });
      })
    );
  }

  async getSlateVersionById(d: { id: string; slate: Slate }) {
    let func = await db.slateVersion.findFirst({
      where: {
        slateOid: d.slate.oid,
        OR: [{ id: d.id }, { version: d.id }]
      },
      include
    });
    if (!func) throw new ServiceError(notFoundError('slate.version'));
    return func;
  }

  async listSlateVersions(d: { slate: Slate }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateVersion.findMany({
            ...opts,
            where: {
              slateOid: d.slate.oid
            },
            include
          })
      )
    );
  }
}

export let slateVersionService = Service.create(
  'slateVersionService',
  () => new slateVersionServiceImpl()
).build();
