import type {
  Slate,
  SlateVersionDiscovery,
  SlateSpecification,
  SlateVersion
} from '../../prisma/generated/client';
import { slateVersionPresenter } from './slateVersion';

export let slateVersionDiscoveryPresenter = (
  slateVersionDiscovery: SlateVersionDiscovery & {
    slateVersion: SlateVersion & {
      specification: SlateSpecification | null;
      slate: Slate;
    };
  }
) => ({
  object: 'slate.discovery',

  id: slateVersionDiscovery.id,
  status: slateVersionDiscovery.status,

  error: slateVersionDiscovery.errorCode
    ? {
        code: slateVersionDiscovery.errorCode,
        message: slateVersionDiscovery.errorMessage ?? slateVersionDiscovery.errorCode
      }
    : null,

  slate: {
    id: slateVersionDiscovery.slateVersion.slate.id,
    name: slateVersionDiscovery.slateVersion.slate.name,
    identifier: slateVersionDiscovery.slateVersion.slate.identifier
  },

  version: slateVersionPresenter({
    ...slateVersionDiscovery.slateVersion,
    slate: slateVersionDiscovery.slateVersion.slate
  }),

  createdAt: slateVersionDiscovery.createdAt
});
