import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateSpecificationPresenter } from '../../presenters';
import { slateSpecificationService } from '../../services';
import { app } from './_app';
import { slateApp } from './slate';

export let slateSpecificationApp = slateApp.use(async ctx => {
  let slateSpecificationId = ctx.body.slateSpecificationId;
  if (!slateSpecificationId) throw new Error('Slate Specification ID is required');

  let slateSpecification = await slateSpecificationService.getSlateSpecificationById({
    id: slateSpecificationId,
    slate: ctx.slate
  });

  return { slateSpecification };
});

export let slateSpecificationController = app.controller({
  list: slateApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateId: v.string(),
          versionIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateSpecificationService.listSlateSpecifications({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateSpecificationPresenter);
    }),

  get: slateSpecificationApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string(),
        slateSpecificationId: v.string()
      })
    )
    .do(async ctx => slateSpecificationPresenter(ctx.slateSpecification))
});
