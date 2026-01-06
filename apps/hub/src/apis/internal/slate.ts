import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slatePresenter } from '../../presenters';
import { slateService } from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateApp = tenantApp.use(async ctx => {
  let slateId = ctx.body.slateId;
  if (!slateId) throw new Error('Slate ID is required');

  let slate = await slateService.getSlateById({
    id: slateId,
    tenant: ctx.tenant
  });

  return { slate };
});

export let slateController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string()
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateService.listSlates({
        tenant: ctx.tenant
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slatePresenter);
    }),

  get: slateApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string()
      })
    )
    .do(async ctx => slatePresenter(ctx.slate)),

  getRegistryRecord: slateApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string()
      })
    )
    .do(
      async ctx =>
        await slateService.getSlateRegistryRecord({
          slate: ctx.slate
        })
    )
});
