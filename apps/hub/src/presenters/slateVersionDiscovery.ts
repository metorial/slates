import type {
  Slate,
  SlateInvocation,
  SlateSpecification,
  SlateVersion,
  SlateVersionDiscovery
} from '../../prisma/generated/client';
import { slateSpecificationPresenter } from './slateSpecification';

export let slateVersionDiscoveryPresenter = (
  spec: SlateVersionDiscovery & {
    slateVersion: SlateVersion & {
      slate: Slate;
    };
    specification: SlateSpecification | null;
    invocation: SlateInvocation | null;
  }
) => ({
  object: 'slate.version_discovery',

  id: spec.id,

  slateVersionId: spec.slateVersion.id,
  slateInvocationId: spec.invocation?.id,

  error: spec.errorMessage
    ? {
        code: 'version_discovery_error',
        message: spec.errorMessage
      }
    : undefined,

  specification: spec.specification
    ? slateSpecificationPresenter({
        ...spec.specification,
        slate: spec.slateVersion.slate
      })
    : undefined,

  createdAt: spec.createdAt
});
