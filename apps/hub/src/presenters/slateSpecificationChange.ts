import type {
  Slate,
  SlateSpecification,
  SlateSpecificationChange,
  SlateVersion
} from '../../prisma/generated/client';
import { slateSpecificationPresenter } from './slateSpecification';

export let slateSpecificationChangePresenter = (
  spec: SlateSpecificationChange & {
    slate: Slate;

    fromVersion: SlateVersion;
    toVersion: SlateVersion;

    fromSpecification: SlateSpecification;
    toSpecification: SlateSpecification;
  }
) => ({
  object: 'slate.specification_change',

  id: spec.id,
  type: spec.type,

  fromVersionId: spec.fromVersion.id,
  toVersionId: spec.toVersion.id,

  fromSpecification: slateSpecificationPresenter({
    ...spec.fromSpecification,
    slate: spec.slate
  }),
  toSpecification: slateSpecificationPresenter({
    ...spec.toSpecification,
    slate: spec.slate
  }),

  createdAt: spec.createdAt
});
