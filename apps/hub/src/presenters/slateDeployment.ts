import type {
  Slate,
  SlateDeployment,
  SlateSpecification,
  SlateVersion
} from '../../prisma/generated/client';
import { slateVersionPresenter } from './slateVersion';

export let slateDeploymentPresenter = (
  slateDeployment: SlateDeployment & {
    slate: Slate;
    slateVersion: SlateVersion & {
      specification: SlateSpecification | null;
    };
  }
) => ({
  object: 'slate.deployment',

  id: slateDeployment.id,
  status: slateDeployment.status,

  error: slateDeployment.errorCode
    ? {
        code: slateDeployment.errorCode,
        message: slateDeployment.errorMessage ?? slateDeployment.errorCode
      }
    : null,

  slate: {
    id: slateDeployment.slate.id,
    name: slateDeployment.slate.name,
    identifier: slateDeployment.slate.identifier
  },

  version: slateVersionPresenter({
    ...slateDeployment.slateVersion,
    slate: slateDeployment.slate
  }),

  createdAt: slateDeployment.createdAt
});
