import type {
  Slate,
  SlateInvocation,
  SlateSpecification,
  SlateVersion,
  SlateVersionDiscovery
} from '../../prisma/generated/client';
import { slateSpecificationPresenter } from './slateSpecification';

export let slateVersionDiscoveryPresenter = (
  discovery: SlateVersionDiscovery & {
    slateVersion: SlateVersion & {
      slate: Slate;
    };
    specification: SlateSpecification | null;
    invocation: SlateInvocation | null;
  }
) => ({
  object: 'slate.version_discovery',

  id: discovery.id,

  slateVersionId: discovery.slateVersion.id,
  slateInvocationId: discovery.invocation?.id,

  error: discovery.errorMessage
    ? {
        code: 'version_discovery_error',
        message: discovery.errorMessage
      }
    : undefined,

  specification: discovery.specification
    ? slateSpecificationPresenter({
        ...discovery.specification,
        slate: discovery.slateVersion.slate
      })
    : undefined,

  createdAt: discovery.createdAt
});
