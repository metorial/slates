import type { Slate, SlateSpecification } from '../../prisma/generated/client';

export let slateSpecificationPresenter = (
  spec: SlateSpecification & {
    slate: Slate;
  }
) => ({
  object: 'slate.specification',

  id: spec.id,
  slateId: spec.slate.id,

  identifier: spec.identifier,

  name: spec.name,
  key: spec.key,

  providerInfo: spec.providerInfo,
  configSchema: spec.configSchema,
  authMethods: spec.authMethods,
  actions: spec.actions,

  createdAt: spec.createdAt
});
