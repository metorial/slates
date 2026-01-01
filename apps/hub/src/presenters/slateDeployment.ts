import type { Slate, SlateDeployment, SlateVersion } from '../../prisma/generated/client';
import { slateVersionPresenter } from './slateVersion';

export let slateDeploymentPresenter = (
  slateDeployment: SlateDeployment & {
    slate: Slate;
    slateVersion: SlateVersion;
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
