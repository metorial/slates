import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateAuthConfigPresenter } from '../../presenters';
import { slateAuthConfigService, slateInstanceService, slateService } from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateAuthConfigApp = tenantApp.use(async ctx => {
  let slateAuthConfigId = ctx.body.slateAuthConfigId;
  if (!slateAuthConfigId) throw new Error('Slate AuthConfig ID is required');

  let slateAuthConfig = await slateAuthConfigService.getSlateAuthConfigById({
    id: slateAuthConfigId,
    tenant: ctx.tenant
  });

  return { slateAuthConfig };
});

export let slateAuthConfigController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateAuthConfigService.listSlateAuthConfigs({
        tenant: ctx.tenant,
        slateIds: ctx.input.slateIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateAuthConfigPresenter);
    }),

  create: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateId: v.string(),
          slateInstanceId: v.optional(v.string()),
          authMethodId: v.optional(v.string()),
          authConfig: v.record(v.any())
        })
      )
    )
    .do(async ctx => {
      let slate = await slateService.getSlateById({
        id: ctx.input.slateId
      });
      let slateInstance = ctx.input.slateInstanceId
        ? await slateInstanceService.getSlateInstanceById({
            id: ctx.input.slateInstanceId,
            tenant: ctx.tenant
          })
        : undefined;

      let res = await slateAuthConfigService.createSlateAuthConfig({
        tenant: ctx.tenant,
        slate,
        slateInstance,

        input: {
          authConfig: ctx.input.authConfig,
          authMethodId: ctx.input.authMethodId
        }
      });

      return slateAuthConfigPresenter(res);
    }),

  get: slateAuthConfigApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateAuthConfigId: v.string()
      })
    )
    .do(async ctx => slateAuthConfigPresenter(ctx.slateAuthConfig))
});
