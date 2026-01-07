import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateInstanceOAuthSetupPresenter } from '../../presenters';
import { slateInstanceOAuthSetupLogsPresenter } from '../../presenters/slateOAuthSetupLogs';
import {
  slateInstanceOAuthSetupService,
  slateInstanceService,
  slateOAuthCredentialsService,
  slateService
} from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateOAuthSetupApp = tenantApp.use(async ctx => {
  let slateOAuthSetupId = ctx.body.slateOAuthSetupId;
  if (!slateOAuthSetupId) throw new Error('Slate OAuthSetup ID is required');

  let slateOAuthSetup = await slateInstanceOAuthSetupService.getSlateInstanceOAuthSetupById({
    id: slateOAuthSetupId,
    tenant: ctx.tenant
  });

  return { slateOAuthSetup };
});

export let slateOAuthSetupController = app.controller({
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
      let paginator = await slateInstanceOAuthSetupService.listSlateInstanceOAuthSetups({
        tenant: ctx.tenant,
        slateIds: ctx.input.slateIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateInstanceOAuthSetupPresenter);
    }),

  create: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateId: v.string(),
          slateOAuthCredentialsId: v.string(),
          slateInstanceId: v.optional(v.string()),
          authMethodId: v.optional(v.string()),
          redirectUrl: v.string(),
          input: v.record(v.any())
        })
      )
    )
    .do(async ctx => {
      let slate = await slateService.getSlateById({
        id: ctx.input.slateId
      });
      let oauthCredentials = await slateOAuthCredentialsService.getSlateOAuthCredentialsById({
        id: ctx.input.slateOAuthCredentialsId,
        tenant: ctx.tenant
      });
      let slateInstance = ctx.input.slateInstanceId
        ? await slateInstanceService.getSlateInstanceById({
            id: ctx.input.slateInstanceId,
            tenant: ctx.tenant
          })
        : undefined;

      let res = await slateInstanceOAuthSetupService.createSlateInstanceOAuthSetup({
        tenant: ctx.tenant,

        input: {
          slate,
          slateInstance,
          oauthCredentials,

          redirectUrl: ctx.input.redirectUrl,
          authMethodId: ctx.input.authMethodId,

          input: ctx.input.input
        }
      });

      return slateInstanceOAuthSetupPresenter(res);
    }),

  get: slateOAuthSetupApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateOAuthSetupId: v.string()
      })
    )
    .do(async ctx => slateInstanceOAuthSetupPresenter(ctx.slateOAuthSetup)),

  getLogs: slateOAuthSetupApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateOAuthSetupId: v.string()
      })
    )
    .do(async ctx => {
      let logs = await slateInstanceOAuthSetupService.getSlateInstanceOAuthSetupLogs({
        setup: ctx.slateOAuthSetup
      });

      return await slateInstanceOAuthSetupLogsPresenter(logs);
    })
});
