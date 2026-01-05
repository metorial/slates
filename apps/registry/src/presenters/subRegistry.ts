import type { SubRegistry, Tenant } from '../../prisma/generated/client';

export let subRegistryPresenter = (subRegistry: SubRegistry & { tenant: Tenant }) => ({
  object: 'tenant.sub_registry',

  id: subRegistry.id,

  identifier: subRegistry.identifier,
  name: subRegistry.name,

  tenantId: subRegistry.tenant.id,

  createdAt: subRegistry.createdAt
});
