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

  version: slateVersionPresenter({
    ...slateDeployment.slateVersion,
    slate: slateDeployment.slate
  }),

  createdAt: slateDeployment.createdAt
});
