import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { workspacePresenter } from '../../presenters';
import { workspaceService } from '../../services';
import { app } from './_app';
import { instanceApp } from './instance';

export let workspaceApp = instanceApp.use(async ctx => {
  let workspaceId = ctx.body.workspaceId;
  if (!workspaceId) throw new Error('Workspace ID is required');

  let workspace = await workspaceService.getWorkspaceById({
    id: workspaceId,
    instance: ctx.instance
  });

  return { workspace };
});

export let workspaceController = app.controller({
  create: instanceApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),

        name: v.string(),
        identifier: v.string()
      })
    )
    .do(async ctx => {
      let workspace = await workspaceService.createWorkspace({
        instance: ctx.instance,
        input: {
          name: ctx.input.name,
          identifier: ctx.input.identifier
        }
      });
      return workspacePresenter(workspace);
    }),

  list: instanceApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          instanceId: v.string()
        })
      )
    )
    .do(async ctx => {
      let paginator = await workspaceService.listWorkspaces({
        instance: ctx.instance
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, workspacePresenter);
    }),

  get: workspaceApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        workspaceId: v.string()
      })
    )
    .do(async ctx => workspacePresenter(ctx.workspace)),

  update: workspaceApp
    .handler()
    .input(
      v.object({
        instanceId: v.string(),
        workspaceId: v.string(),

        name: v.optional(v.string()),
        description: v.optional(v.string()),
        links: v.optional(v.array(v.object({ url: v.string(), label: v.string() })))
      })
    )
    .do(async ctx => {
      let workspace = await workspaceService.updateWorkspace({
        workspace: ctx.workspace,
        input: {
          name: ctx.input.name,
          description: ctx.input.description,
          links: ctx.input.links
        }
      });

      return workspacePresenter(workspace);
    })
});
