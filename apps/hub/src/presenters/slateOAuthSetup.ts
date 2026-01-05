import type {
  Slate,
  SlateAuthConfig,
  SlateAuthMethod,
  SlateInstanceOAuthSetup,
  SlateOAuthCredentials
} from '../../prisma/generated/client';
import { env } from '../env';
import { slateAuthConfigPresenter } from './slateAuthConfig';
import { slateOAuthCredentialsPresenter } from './slateOAuthCredentials';

export let slateInstanceOAuthSetupPresenter = (
  inst: SlateInstanceOAuthSetup & {
    slate: Slate;
    oauthCredentials: SlateOAuthCredentials;
    slateAuthConfig: (SlateAuthConfig & { authMethod: SlateAuthMethod }) | null;
  }
) => ({
  object: 'slate.oauth_setup',

  id: inst.id,
  slateId: inst.slate.id,
  status: inst.status,
  redirectUrl: inst.redirectUrl,

  url:
    inst.status == 'completed'
      ? null
      : `${env.service.SERVICE_PUBLIC_URL}/slates-hub/authorization?setup_id=${inst.id}`,

  error: inst.errorCode
    ? {
        code: inst.errorCode,
        message: inst.errorMessage ?? inst.errorCode
      }
    : null,

  credentials: slateOAuthCredentialsPresenter({
    ...inst.oauthCredentials,
    slate: inst.slate
  }),

  authConfig: inst.slateAuthConfig
    ? slateAuthConfigPresenter({
        ...inst.slateAuthConfig,
        slate: inst.slate,
        oauthCredentials: inst.oauthCredentials
      })
    : null,

  createdAt: inst.createdAt,
  updatedAt: inst.updatedAt
});
