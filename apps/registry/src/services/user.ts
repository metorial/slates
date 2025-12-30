import { conflictError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Instance, User } from '../../prisma/generated/client';
import { db } from '../db';
import { ID, snowflake } from '../id';

let include = {
  scope: true,
  instance: true
};

class userServiceImpl {
  async createUser(d: {
    input: {
      name: string;
      identifier: string;
    };
    instance: Instance;
  }) {
    return db.$transaction(async db => {
      let existingScope = await db.scope.findFirst({
        where: {
          identifier: d.input.identifier
        }
      });
      if (existingScope) {
        throw new ServiceError(
          conflictError({
            message: `User with identifier ${d.input.identifier} already exists`
          })
        );
      }

      let scope = await db.scope.create({
        data: {
          id: await ID.generateId('scope'),
          oid: snowflake.nextId(),
          type: 'user' as const,
          status: 'active',

          identifier: d.input.identifier,
          name: d.input.name,

          instanceOid: d.instance.oid,

          links: []
        }
      });

      return await db.user.create({
        data: {
          oid: snowflake.nextId(),
          id: await ID.generateId('user'),
          status: 'active',
          access: 'read_write',

          identifier: d.input.identifier,
          name: d.input.name,

          instanceOid: d.instance.oid,
          scopeOid: scope.oid
        },
        include
      });
    });
  }

  async getUserById(d: { id: string; instance?: Instance }) {
    let func = await db.user.findFirst({
      where: {
        OR: [{ id: d.id }, { identifier: d.id }],
        instanceOid: d.instance?.oid,
        status: 'active'
      },
      include
    });
    if (!func) throw new ServiceError(notFoundError('user'));
    return func;
  }

  async listUsers(d: { instance?: Instance }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.user.findMany({
            ...opts,
            where: {
              instanceOid: d.instance?.oid,
              status: 'active'
            },
            include
          })
      )
    );
  }

  async updateUser(d: {
    user: User;
    input: {
      name?: string;
      description?: string;
      links?: { url: string; label: string }[];
    };
  }) {
    return await db.$transaction(async db => {
      await db.scope.update({
        where: { oid: d.user.scopeOid },
        data: {
          name: d.input.name,
          description: d.input.description,
          links: d.input.links
        }
      });

      return await db.user.update({
        where: { oid: d.user.oid },
        data: { name: d.input.name },
        include
      });
    });
  }
}

export let userService = Service.create('userService', () => new userServiceImpl()).build();
