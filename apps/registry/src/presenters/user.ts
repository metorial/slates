import type { Instance, Scope, User } from '../../prisma/generated/client';
import { scopePresenter } from './scope';

export let userPresenter = (user: User & { scope: Scope; instance: Instance }) => ({
  object: 'user',

  id: user.id,
  status: user.status,

  identifier: user.identifier,
  name: user.name,

  scope: scopePresenter({ ...user.scope, instance: user.instance }),
  instanceId: user.instance.id,

  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});
