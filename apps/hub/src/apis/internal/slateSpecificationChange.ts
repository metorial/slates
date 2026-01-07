import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateSpecificationChangePresenter } from '../../presenters';
import { slateSpecificationChangeService } from '../../services';
import { app } from './_app';
import { slateApp } from './slate';

export let slateSpecificationChangeApp = slateApp.use(async ctx => {
  let slateSpecificationChangeId = ctx.body.slateSpecificationChangeId;
  if (!slateSpecificationChangeId) throw new Error('Slate SpecificationChange ID is required');

  let slateSpecificationChange =
    await slateSpecificationChangeService.getSlateSpecificationChangeById({
      id: slateSpecificationChangeId,
      slate: ctx.slate
    });

  return { slateSpecificationChange };
});

export let slateSpecificationChangeController = app.controller({
  list: slateApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          slateId: v.string(),
          versionIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateSpecificationChangeService.listSlateSpecificationChanges({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateSpecificationChangePresenter);
    }),

  get: slateSpecificationChangeApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateSpecificationChangeId: v.string()
      })
    )
    .do(async ctx => slateSpecificationChangePresenter(ctx.slateSpecificationChange))
});
