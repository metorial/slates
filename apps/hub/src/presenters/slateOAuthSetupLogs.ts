import { shadowId } from '@lowerdeck/shadow-id';
import type {
  Slate,
  SlateDeployment,
  SlateInstanceOAuthSetup,
  SlateInstanceOAuthSetupEvent,
  SlateInvocation,
  SlateOAuthCredentials,
  SlateVersion
} from '../../prisma/generated/client';
import { slateInvocationPresenter } from './slateInvocation';

export let slateInstanceOAuthSetupLogsPresenter = async (
  inst: SlateInstanceOAuthSetup & {
    slate: Slate;
    oauthCredentials: SlateOAuthCredentials;
    events: (SlateInstanceOAuthSetupEvent & {
      invocation:
        | (SlateInvocation & {
            deployment: SlateDeployment & {
              slateVersion: SlateVersion;
            };
          })
        | null;
    })[];
  }
) => ({
  object: 'slate.oauth_setup',

  id: inst.id,
  slateId: inst.slate.id,

  error: inst.errorCode
    ? {
        code: inst.errorCode,
        message: inst.errorMessage ?? inst.errorCode
      }
    : null,

  events: await Promise.all(
    inst.events.map(async inv => ({
      object: 'slate.oauth_setup.log',
      id: shadowId('shsoxl', [inst.id], [inv.oid]),
      type: inv.type,
      invocation: inv.invocation ? await slateInvocationPresenter(inv.invocation) : null,
      createdAt: inv.createdAt
    }))
  )
});
