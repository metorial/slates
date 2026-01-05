import type { Slate, SlateOAuthCredentials } from '../../prisma/generated/client';

export let slateOAuthCredentialsPresenter = (
  inst: SlateOAuthCredentials & {
    slate: Slate;
  }
) => ({
  object: 'slate.oauth_credentials',

  id: inst.id,
  slateId: inst.slate.id,

  clientId: inst.clientId,
  // clientSecret: inst.clientSecret,
  scopes: inst.scopes,

  createdAt: inst.createdAt,
  updatedAt: inst.updatedAt
});
