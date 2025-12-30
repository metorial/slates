import { shadowId } from '@lowerdeck/shadow-id';
import type { Instance, Scope } from '../../prisma/generated/client';

export let scopePresenter = (scope: Scope & { instance: Instance }) => ({
  object: 'scope',

  id: scope.id,
  type: scope.type,
  status: scope.status,

  instanceId: scope.instance.id,

  identifier: scope.identifier,
  name: scope.name,
  description: scope.description,
  links: scope.links.map((link, i) => ({
    id: shadowId('srsopln', [scope.id], [link.url, i]),
    ...link
  })),

  createdAt: scope.createdAt,
  updatedAt: scope.updatedAt
});
