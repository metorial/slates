import {
  badRequestError,
  notFoundError,
  ServiceError,
  unauthorizedError
} from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { User, UserToken } from '../../prisma/generated/client';
import { db } from '../db';
import { env } from '../env';
import { ID, snowflake } from '../id';
import { apiKeys } from '../keys';

let include = {
  user: true,
  instance: true
};

class userTokenServiceImpl {
  async createUserToken(d: {
    input: {
      name: string;
      expiresAt?: Date;
    };
    user: User;
  }) {
    return await db.userToken.create({
      data: {
        oid: snowflake.nextId(),
        id: await ID.generateId('token'),
        status: 'active',

        name: d.input.name,

        secret: apiKeys
          .create({
            type: 'user_auth_token',
            config: { url: env.url.SERVICE_PUBLIC_URL }
          })
          .toString(),

        userOid: d.user.oid,
        instanceOid: d.user.instanceOid,

        expiresAt: d.input.expiresAt
      },
      include
    });
  }

  async getTokenById(d: { id: string; user: User }) {
    let func = await db.userToken.findFirst({
      where: {
        id: d.id,
        userOid: d.user.oid,
        status: 'active'
      },
      include
    });
    if (!func) throw new ServiceError(notFoundError('token'));
    return func;
  }

  async listTokens(d: { user: User }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.userToken.findMany({
            ...opts,
            where: {
              userOid: d.user.oid,
              status: 'active'
            },
            include
          })
      )
    );
  }

  async deleteUserToken(d: { token: UserToken }) {
    return await db.userToken.update({
      where: { oid: d.token.oid },
      data: { status: 'revoked' },
      include
    });
  }

  async updateUserToken(d: {
    token: UserToken;
    input: {
      name?: string;
      expiresAt?: Date;
    };
  }) {
    if (d.token.expiresAt && d.input.expiresAt && d.input.expiresAt < d.token.expiresAt) {
      throw new ServiceError(
        badRequestError({
          message: 'Cannot reduce the expiration date of a token.'
        })
      );
    }

    if (d.input.expiresAt && d.input.expiresAt < new Date()) {
      throw new ServiceError(
        badRequestError({
          message: 'Expiration date cannot be in the past.'
        })
      );
    }

    return await db.userToken.update({
      where: { oid: d.token.oid },
      data: {
        name: d.input.name ?? d.token.name,
        expiresAt: d.input.expiresAt !== undefined ? d.input.expiresAt : d.token.expiresAt
      },
      include
    });
  }

  async authenticateWithUserToken(d: { secret: string }) {
    let token = await db.userToken.findUnique({
      where: {
        secret: d.secret,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }]
      },
      include: {
        user: true,
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
      user: token.user,
      instance: token.instance
    };
  }
}

export let userTokenService = Service.create(
  'userTokenService',
  () => new userTokenServiceImpl()
).build();
