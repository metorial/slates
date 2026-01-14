import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateVersionDiscoveryPresenter } from '../../presenters/slateDiscovery';
import { slateVersionDiscoveryService } from '../../services/slateDiscovery';
import { app } from './_app';
import { slateApp } from './slate';
import { slateVersionApp } from './slateVersion';

export let slateDiscoveryApp = slateVersionApp.use(async ctx => {
  let slateDiscoveryId = ctx.body.slateDiscoveryId;
  if (!slateDiscoveryId) throw new Error('Slate Discovery ID is required');

  let slateDiscovery = await slateVersionDiscoveryService.getSlateVersionDiscoveryById({
    id: slateDiscoveryId,
    slateVersion: ctx.slateVersion
  });

  return { slateDiscovery };
});

export let slateDiscoveryController = app.controller({
  listAll: app
    .handler()
    .input(
      Paginator.validate(
        v.object({
          status: v.optional(v.string())
        })
      )
    )
    .do(async ctx => {
      let status = ctx.input.status as 'succeeded' | 'failed' | undefined;
      let paginator = await slateVersionDiscoveryService.listAllDiscoveries({
        status
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateVersionDiscoveryPresenter);
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
      let paginator = await slateVersionDiscoveryService.listSlateVersionDiscoveries({
        slate: ctx.slate,
        versionIds: ctx.input.versionIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateVersionDiscoveryPresenter);
    }),

  get: slateDiscoveryApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateVersionId: v.string(),
        slateDiscoveryId: v.string()
      })
    )
    .do(async ctx => slateVersionDiscoveryPresenter(ctx.slateDiscovery)),

  getBuildOutput: slateDiscoveryApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateVersionId: v.string(),
        slateDiscoveryId: v.string()
      })
    )
    .do(async ctx => {
      let res = await slateVersionDiscoveryService.getBuildOutput({
        slateVersionDiscovery: ctx.slateDiscovery
      });

      return res;
    }),

  getSpecification: slateDiscoveryApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateVersionId: v.string(),
        slateDiscoveryId: v.string()
      })
    )
    .do(async ctx => {
      return await slateVersionDiscoveryService.getSpecification({
        slateVersionDiscovery: ctx.slateDiscovery
      });
    }),

  getToolCallStats: slateDiscoveryApp
    .handler()
    .input(
      v.object({
        slateId: v.string(),
        slateVersionId: v.string(),
        slateDiscoveryId: v.string()
      })
    )
    .do(async ctx => {
      return await slateVersionDiscoveryService.getToolCallStats({
        slateVersionDiscovery: ctx.slateDiscovery
      });
    })
});
