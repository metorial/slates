import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateEventPresenter } from '../../presenters';
import { slateEventService } from '../../services';
import { app } from './_app';
import { slateApp } from './slate';

export let slateEventApp = slateApp.use(async ctx => {
  let slateEventId = ctx.body.slateEventId;
  if (!slateEventId) throw new Error('Slate Event ID is required');

  let slateEvent = await slateEventService.getSlateEventById({
    id: slateEventId,
    slate: ctx.slate
  });

  return { slateEvent };
});

export let slateEventController = app.controller({
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
      let paginator = await slateEventService.listSlateEvents({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateEventPresenter);
    }),

  get: slateEventApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string(),
        slateEventId: v.string()
      })
    )
    .do(async ctx => slateEventPresenter(ctx.slateEvent))
});
