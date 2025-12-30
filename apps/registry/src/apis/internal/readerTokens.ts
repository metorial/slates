import { v } from '@lowerdeck/validation';
import { readerTokenPresenter } from '../../presenters';
import { instanceService, readerTokenService } from '../../services';
import { app } from './_app';

export let readerTokenController = app.controller({
  create: app
    .handler()
    .input(
      v.object({
        instanceId: v.optional(v.string()),
        name: v.string(),
        expiresAt: v.optional(v.date())
      })
    )
    .do(async ctx => {
      let instance = ctx.input.instanceId
        ? await instanceService.getInstanceById({
            id: ctx.input.instanceId
          })
        : undefined;

      let token = await readerTokenService.createReaderToken({
        input: {
          instance,
          name: ctx.input.name,
          expiresAt: ctx.input.expiresAt
        }
      });

      return {
        ...readerTokenPresenter(token),
        secret: token.secret
      };
    })
});
