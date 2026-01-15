import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { SlateDeploymentStatus } from '../../../prisma/generated/client';
import { slateDeploymentPresenter } from '../../presenters';
import { slateDeploymentService } from '../../services';
import { app } from './_app';
import { slateApp } from './slate';

export let slateDeploymentApp = slateApp.use(async ctx => {
  let slateDeploymentId = ctx.body.slateDeploymentId;
  if (!slateDeploymentId) throw new Error('Slate Deployment ID is required');

  let slateDeployment = await slateDeploymentService.getSlateDeploymentById({
    id: slateDeploymentId,
    slate: ctx.slate
  });

  return { slateDeployment };
});

export let slateDeploymentController = app.controller({
  listAll: app
    .handler()
    .input(
      Paginator.validate(
        v.object({
          status: v.optional(v.enumOf(Object.values(SlateDeploymentStatus) as [SlateDeploymentStatus, ...SlateDeploymentStatus[]]))
        })
      )
    )
    .do(async ctx => {
      let status = ctx.input.status;
      let paginator = await slateDeploymentService.listSlateDeployments({
        status
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateDeploymentPresenter);
    }),

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
      let paginator = await slateDeploymentService.listSlateDeployments({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateDeploymentPresenter);
    }),

  get: slateDeploymentApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateDeploymentId: v.string()
      })
    )
    .do(async ctx => slateDeploymentPresenter(ctx.slateDeployment)),

  getBuildOutput: slateDeploymentApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateDeploymentId: v.string()
      })
    )
    .do(async ctx => {
      let res = await slateDeploymentService.getBuildOutput({
        slateDeployment: ctx.slateDeployment
      });

      return res;
    })
});
