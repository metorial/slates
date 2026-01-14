import type {
  Slate,
  SlateDeployment,
  SlateEvent,
  SlateVersion,
  SlateVersionDiscovery
} from '../../prisma/generated/client';

export let slateEventPresenter = (
  evt: SlateEvent & {
    slateVersion: SlateVersion & {
      activeDeployment?: SlateDeployment | null;
      slateVersionDiscoveries?: SlateVersionDiscovery[];
    };
    slate?: Slate;
  }
) => {
  let deployment = evt.slateVersion.activeDeployment;
  let discovery = evt.slateVersion.slateVersionDiscoveries?.[0];

  return {
    object: 'slate.event',

    id: evt.id,
    type: evt.type,
    message: evt.message,

    slate: evt.slate
      ? {
          id: evt.slate.id,
          name: evt.slate.name,
          identifier: evt.slate.identifier
        }
      : null,

    version: {
      id: evt.slateVersion.id,
      version: evt.slateVersion.version
    },

    deployment: deployment
      ? {
          id: deployment.id,
          status: deployment.status
        }
      : null,

    discovery: discovery
      ? {
          id: discovery.id,
          status: discovery.status
        }
      : null,

    createdAt: evt.createdAt
  };
};
