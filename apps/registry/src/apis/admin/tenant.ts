import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { tenantPresenter } from '../../presenters';
import { tenantService } from '../../services';
import { app } from './_app';

export let tenantApp = app.use(async ctx => {
  let tenantId = ctx.body.tenantId;
  if (!tenantId) throw new Error('Tenant ID is required');

  let tenant = await tenantService.getTenantById({ id: tenantId });

  return { tenant };
});

export let tenantController = app.controller({
  list: app
    .handler()
    .input(Paginator.validate(v.object({})))
    .do(async ctx => {
      let paginator = await tenantService.listTenants({});
      let list = await paginator.run(ctx.input);
      return Paginator.presentLight(list, tenantPresenter);
    }),

  upsert: app
    .handler()
    .input(
      v.object({
        name: v.string(),
        identifier: v.string()
      })
    )
    .do(async ctx => {
      let tenant = await tenantService.upsertTenant({
        input: {
          name: ctx.input.name,
          identifier: ctx.input.identifier
        }
      });
      return tenantPresenter(tenant);
    }),

  get: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string()
      })
    )
    .do(async ctx => tenantPresenter(ctx.tenant)),

  update: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        name: v.optional(v.string())
      })
    )
    .do(async ctx => {
      let tenant = await tenantService.updateTenant({
        tenant: ctx.tenant,
        input: {
          name: ctx.input.name
        }
      });
      return tenantPresenter(tenant);
    })
});
