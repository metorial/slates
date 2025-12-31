import { v } from '@lowerdeck/validation';
import { readerTokenPresenter } from '../../presenters';
import { readerTokenService, tenantService } from '../../services';
import { app } from './_app';

export let readerTokenController = app.controller({
  create: app
    .handler()
    .input(
      v.object({
        tenantId: v.optional(v.string()),
        name: v.string(),
        expiresAt: v.optional(v.date())
      })
    )
    .do(async ctx => {
      let tenant = ctx.input.tenantId
        ? await tenantService.getTenantById({
            id: ctx.input.tenantId
          })
        : undefined;

      let token = await readerTokenService.createReaderToken({
        input: {
          tenant,
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
