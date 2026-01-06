import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { registryPresenter } from '../../presenters';
import { registryService } from '../../services';
import { app } from './_app';

export let registryApp = app.use(async ctx => {
  let registryId = ctx.body.registryId;
  if (!registryId) throw new Error('Slate Registry ID is required');

  let registry = await registryService.getRegistryById({
    id: registryId
  });

  return { registry };
});

export let registryController = app.controller({
  list: app
    .handler()
    .input(Paginator.validate(v.object({})))
    .do(async ctx => {
      let paginator = await registryService.listRegistries({});

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, registryPresenter);
    }),

  get: registryApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string(),
        registryId: v.string()
      })
    )
    .do(async ctx => registryPresenter(ctx.registry))
});
