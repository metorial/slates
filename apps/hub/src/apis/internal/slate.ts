import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slatePresenter } from '../../presenters';
import { slateService } from '../../services';
import { app } from './_app';

export let slateApp = app.use(async ctx => {
  let slateId = ctx.body.slateId;
  if (!slateId) throw new Error('Slate ID is required');

  let slate = await slateService.getSlateById({
    id: slateId
  });

  return { slate };
});

export let slateController = app.controller({
  list: app
    .handler()
    .input(Paginator.validate(v.object({})))
    .do(async ctx => {
      let paginator = await slateService.listSlates({});

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slatePresenter);
    }),

  get: slateApp
    .handler()
    .input(
      v.object({
        slateId: v.string()
      })
    )
    .do(async ctx => slatePresenter(ctx.slate)),

  getRegistryRecord: slateApp
    .handler()
    .input(
      v.object({
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
