import type { Instance, ReaderToken } from '../../prisma/generated/client';
import { apiKeys } from '../keys';

export let readerTokenPresenter = (token: ReaderToken & { instance: Instance | null }) => ({
  object: 'reader_token',

  id: token.id,
  status: token.status,

  name: token.name,
  secretRedacted: apiKeys.redact(token.secret),

  instanceId: token.instance?.id ?? null,

  createdAt: token.createdAt,
  updatedAt: token.updatedAt,
  expiresAt: token.expiresAt
});
