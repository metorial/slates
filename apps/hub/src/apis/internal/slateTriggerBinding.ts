import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateTriggerBindingPresenter } from '../../presenters';
import { slateTriggerBindingService } from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateTriggerBindingApp = tenantApp.use(async ctx => {
  let slateTriggerBindingId = ctx.body.slateTriggerBindingId;
  if (!slateTriggerBindingId) throw new Error('Trigger binding ID is required');

  let triggerBinding = await slateTriggerBindingService.getTriggerBindingById({
    tenant: ctx.tenant,
    id: slateTriggerBindingId
  });

  return { triggerBinding };
});

export let slateTriggerBindingController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateSharedTriggerConfigIds: v.optional(v.array(v.string())),
          slateSharedTriggerConfigTriggerIds: v.optional(v.array(v.string())),
          slateInstanceIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateTriggerBindingService.listTriggerBindings({
        tenant: ctx.tenant,
        sharedTriggerConfigIds: ctx.input.slateSharedTriggerConfigIds,
        sharedTriggerConfigTriggerIds: ctx.input.slateSharedTriggerConfigTriggerIds,
        slateInstanceIds: ctx.input.slateInstanceIds
      });

      let list = await paginator.run(ctx.input);
      return Paginator.presentLight(list, slateTriggerBindingPresenter);
    }),

  upsert: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigTriggerId: v.string(),
        slateInstanceId: v.string(),
        authConfigId: v.optional(v.nullable(v.string())),
        externalKey: v.string()
      })
    )
    .do(async ctx =>
      slateTriggerBindingPresenter(
        await slateTriggerBindingService.upsertTriggerBinding({
          tenant: ctx.tenant,
          input: {
            sharedTriggerConfigTriggerId: ctx.input.slateSharedTriggerConfigTriggerId,
            slateInstanceId: ctx.input.slateInstanceId,
            authConfigId: ctx.input.authConfigId,
            externalKey: ctx.input.externalKey
          }
        })
      )
    ),

  get: slateTriggerBindingApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerBindingId: v.string()
      })
    )
    .do(async ctx => slateTriggerBindingPresenter(ctx.triggerBinding)),

  delete: slateTriggerBindingApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerBindingId: v.string()
      })
    )
    .do(async ctx =>
      slateTriggerBindingPresenter(
        await slateTriggerBindingService.deleteTriggerBinding({
          tenant: ctx.tenant,
          triggerBindingId: ctx.input.slateTriggerBindingId
        })
      )
    )
});
