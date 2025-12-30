import type { Instance, Token, User } from '../../prisma/generated/client';
import { apiKeys } from '../keys';

export let tokenPresenter = (token: Token & { user: User; instance: Instance }) => ({
  object: 'token',

  id: token.id,
  status: token.status,

  name: token.name,
  secretRedacted: apiKeys.redact(token.secret),

  instanceId: token.instance.id,
  userId: token.user.id,

  createdAt: token.createdAt,
  updatedAt: token.updatedAt,
  expiresAt: token.expiresAt
});
