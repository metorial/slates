import type { Scope, Slate, SlateVersion, Tenant, User } from '../../prisma/generated/client';
import { scopePresenter } from './scope';
import { userPresenter } from './user';

export let slatePresenter = (
  slate: Slate & {
    scope: Scope;
    tenant: Tenant;
    currentVersion: SlateVersion | null;
    createdByUser: User & { scope: Scope };
  }
) => ({
  object: 'slate',

  id: slate.id,
  status: slate.status,
  access: slate.access,

  name: slate.name,
  description: slate.description,

  logoUrl: slate.logoUrl,

  identifier: slate.identifier,
  fullIdentifier: slate.fullIdentifier,

  createdByUser: userPresenter({
    ...slate.createdByUser,
    tenant: slate.tenant
  }),

  scope: scopePresenter({ ...slate.scope, tenant: slate.tenant }),

  currentVersion: slate.currentVersion
    ? {
        id: slate.currentVersion.id,
        version: slate.currentVersion.version,
        createdAt: slate.currentVersion.createdAt
      }
    : null,

  tenantId: slate.tenant.id,

  createdAt: slate.createdAt,
  updatedAt: slate.updatedAt
});
