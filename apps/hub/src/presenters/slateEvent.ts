import type { SlateEvent, SlateVersion } from '../../prisma/generated/client';

export let slateEventPresenter = (
  spec: SlateEvent & {
    slateVersion: SlateVersion;
  }
) => ({
  object: 'slate.specification',

  id: spec.id,
  type: spec.type,
  message: spec.message,

  slateVersionId: spec.slateVersion.id,

  createdAt: spec.createdAt
});
