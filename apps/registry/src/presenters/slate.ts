import type {
  Instance,
  Scope,
  Slate,
  SlateVersion,
  User
} from '../../prisma/generated/client';
import { scopePresenter } from './scope';
import { userPresenter } from './user';

export let slatePresenter = (
  slate: Slate & {
    scope: Scope;
    instance: Instance;
    currentVersion: SlateVersion | null;
    createdByUser: User & { scope: Scope };
  }
) => ({
  object: 'slate',

  id: slate.id,
  status: slate.status,
  access: slate.access,

  name: slate.name,
  identifier: slate.identifier,
  fullIdentifier: slate.fullIdentifier,

  createdByUser: userPresenter({
    ...slate.createdByUser,
    instance: slate.instance
  }),

  scope: scopePresenter({ ...slate.scope, instance: slate.instance }),

  currentVersion: slate.currentVersion
    ? {
        id: slate.currentVersion.id,
        version: slate.currentVersion.version,
        createdAt: slate.currentVersion.createdAt
      }
    : null,

  instanceId: slate.instance.id,

  createdAt: slate.createdAt,
  updatedAt: slate.updatedAt
});
