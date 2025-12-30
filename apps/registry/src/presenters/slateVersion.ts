import type {
  Instance,
  Scope,
  Slate,
  SlateDocument,
  SlateVersion,
  User
} from '../../prisma/generated/client';
import { userPresenter } from './user';

export let slateVersionPresenter = (
  slateVersion: SlateVersion & {
    slate: Slate & {
      instance: Instance;
    };
    createdByUser: User & { scope: Scope };
    slateDocuments: SlateDocument[];
  }
) => ({
  object: 'slate.version',

  id: slateVersion.id,
  version: slateVersion.version,
  isCurrent: slateVersion.isCurrent,

  slateId: slateVersion.slate.id,

  documents: slateVersion.slateDocuments.map(doc => ({
    object: 'slate.document',

    id: doc.id,
    versionId: slateVersion.id,

    path: doc.path,
    content: doc.content,

    createdAt: doc.createdAt
  })),

  createdByUser: userPresenter({
    ...slateVersion.createdByUser,
    instance: slateVersion.slate.instance
  }),

  createdAt: slateVersion.createdAt
});
