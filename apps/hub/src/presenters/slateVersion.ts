import type { Slate, SlateVersion } from '../../prisma/generated/client';

export let slateVersionPresenter = (
  slateVersion: SlateVersion & {
    slate: Slate;
  }
) => ({
  object: 'slate.version',

  id: slateVersion.id,
  status: slateVersion.status,
  version: slateVersion.version,
  isCurrent: slateVersion.isCurrent,

  slateId: slateVersion.slate.id,

  manifest: slateVersion.manifest,
  info: slateVersion.info,

  createdAt: slateVersion.createdAt
});
