import type {
  Slate,
  SlateAuthConfig,
  SlateAuthMethod,
  SlateOAuthCredentials
} from '../../prisma/generated/client';
import { slateAuthMethodPresenter } from './slateAuthMethod';
import { slateOAuthCredentialsPresenter } from './slateOAuthCredentials';

export let slateAuthConfigPresenter = (
  inst: SlateAuthConfig & {
    slate: Slate;
    oauthCredentials: SlateOAuthCredentials | null;
    authMethod: SlateAuthMethod;
  }
) => ({
  object: 'slate.auth_config',

  id: inst.id,
  slateId: inst.slate.id,
  status: inst.errorCode
    ? ('failed' as const)
    : inst.isProcessing
      ? ('processing' as const)
      : ('active' as const),

  error: inst.errorCode
    ? {
        code: inst.errorCode,
        message: inst.errorMessage ?? inst.errorCode
      }
    : null,

  authMethod: slateAuthMethodPresenter({
    ...inst.authMethod,
    slate: inst.slate
  }),

  oauthCredentials: inst.oauthCredentials
    ? slateOAuthCredentialsPresenter({
        ...inst.oauthCredentials,
        slate: inst.slate
      })
    : null,

  tokenExpiresAt: inst.tokenExpiresAt,

  createdAt: inst.createdAt,
  updatedAt: inst.updatedAt
});
