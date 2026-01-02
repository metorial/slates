import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateInvocationPresenter } from '../../presenters';
import { slateInvocationService } from '../../services';
import { app } from './_app';
import { slateApp } from './slate';

export let slateInvocationApp = slateApp.use(async ctx => {
  let slateInvocationId = ctx.body.slateInvocationId;
  if (!slateInvocationId) throw new Error('Slate Invocation ID is required');

  let slateInvocation = await slateInvocationService.getSlateInvocationById({
    id: slateInvocationId,
    slate: ctx.slate
  });

  return { slateInvocation };
});

export let slateInvocationController = app.controller({
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
      let paginator = await slateInvocationService.listSlateInvocations({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateInvocationPresenter);
    }),

  get: slateInvocationApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string(),
        slateInvocationId: v.string()
      })
    )
    .do(async ctx => slateInvocationPresenter(ctx.slateInvocation))
});
