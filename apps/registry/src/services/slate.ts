import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';

let include = {
  scope: true,
  tenant: true,
  currentVersion: true,
  createdByUser: { include: { scope: true } }
};

class slateServiceImpl {
  async getSlateById(d: { id: string; tenant?: Tenant }) {
    let slate = await db.slate.findFirst({
      where: {
        status: 'active',

        AND: [
          {
            OR: [{ id: d.id }, { fullIdentifier: d.id }]
          },

          d.tenant
            ? { OR: [{ tenantOid: d.tenant.oid }, { access: 'public' }] }
            : { access: 'public' }
        ]
      },
      include
    });
    if (!slate) throw new ServiceError(notFoundError('slate'));
    return slate;
  }

  async listSlates(d: {
    tenant?: Tenant;
    scopeIds?: string[];
    userIds?: string[];
    workspaceIds?: string[];
  }) {
    let scopes = d.scopeIds
      ? await db.scope.findMany({
          where: {
            status: 'active',
            OR: [{ id: { in: d.scopeIds } }, { identifier: { in: d.scopeIds } }]
          }
        })
      : undefined;
    let users = d.userIds
      ? await db.user.findMany({
          where: {
            status: 'active',
            OR: [{ id: { in: d.userIds } }, { identifier: { in: d.userIds } }]
          }
        })
      : undefined;
    let workspaces = d.workspaceIds
      ? await db.workspace.findMany({
          where: {
            status: 'active',
            OR: [{ id: { in: d.workspaceIds } }, { identifier: { in: d.workspaceIds } }]
          }
        })
      : undefined;

    let scopeOids = scopes ? scopes.map(s => s.oid) : undefined;
    let userScopeOids = users ? users.map(u => u.scopeOid) : undefined;
    let workspaceScopeOids = workspaces ? workspaces.map(w => w.scopeOid) : undefined;

    let anyScopeOids =
      scopeOids || userScopeOids || workspaceScopeOids
        ? [...(scopeOids || []), ...(userScopeOids || []), ...(workspaceScopeOids || [])]
        : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slate.findMany({
            ...opts,
            where: {
              status: 'active',

              scopeOid: anyScopeOids ? { in: anyScopeOids } : undefined,

              AND: [
                d.tenant
                  ? { OR: [{ tenantOid: d.tenant.oid }, { access: 'public' }] }
                  : { access: 'public' }
              ]
            },
            include
          })
      )
    );
  }
}

export let slateService = Service.create('slateService', () => new slateServiceImpl()).build();
