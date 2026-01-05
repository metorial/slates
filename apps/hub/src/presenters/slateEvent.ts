import type { SlateEvent, SlateVersion } from '../../prisma/generated/client';

export let slateEventPresenter = (
  evt: SlateEvent & {
    slateVersion: SlateVersion;
  }
) => ({
  object: 'slate.specification',

  id: evt.id,
  type: evt.type,
  message: evt.message,

  slateVersionId: evt.slateVersion.id,

  createdAt: evt.createdAt
});
