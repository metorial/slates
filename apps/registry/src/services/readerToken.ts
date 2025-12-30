import { ServiceError, unauthorizedError } from '@lowerdeck/error';
import { Service } from '@lowerdeck/service';
import type { Instance } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { ID, snowflake } from '../id';
import { apiKeys } from '../keys';

let include = {
  instance: true
};

class readerTokenServiceImpl {
  async createReaderToken(d: {
    input: {
      name: string;
      expiresAt?: Date;
      instance?: Instance;
    };
  }) {
    return await db.readerToken.create({
      data: {
        oid: snowflake.nextId(),
        id: await ID.generateId('token'),
        status: 'active',

        name: d.input.name,

        secret: apiKeys
          .create({
            type: 'reader_token',
            config: { url: env.url.SERVICE_PUBLIC_URL }
          })
          .toString(),

        instanceOid: d.input.instance?.oid,

        expiresAt: d.input.expiresAt
      },
      include
    });
  }

  async authenticateWithReaderToken(d: { secret: string }) {
    let token = await db.readerToken.findUnique({
      where: {
        secret: d.secret,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: {
        instance: true
      }
    });
    if (!token)
      throw new ServiceError(
        unauthorizedError({
          message: 'The provided Slates token is invalid or has expired.'
        })
      );

    return {
      token,
      instance: token.instance
    };
  }
}

export let readerTokenService = Service.create(
  'readerTokenService',
  () => new readerTokenServiceImpl()
).build();
