import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { SlateSharedTriggerConfigStatus } from '../../../prisma/generated/client';
import { slateSharedTriggerConfigPresenter } from '../../presenters';
import { slateSharedTriggerConfigService } from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateSharedTriggerConfigApp = tenantApp.use(async ctx => {
  let slateSharedTriggerConfigId = ctx.body.slateSharedTriggerConfigId;
  if (!slateSharedTriggerConfigId) throw new Error('Shared trigger config ID is required');

  let sharedTriggerConfig = await slateSharedTriggerConfigService.getSharedTriggerConfigById({
    tenant: ctx.tenant,
    id: slateSharedTriggerConfigId
  });

  return { sharedTriggerConfig };
});

export let slateSharedTriggerConfigController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateSharedTriggerConfigService.listSharedTriggerConfigs({
        tenant: ctx.tenant,
        slateIds: ctx.input.slateIds
      });
      let list = await paginator.run(ctx.input);
      return Paginator.presentLight(list, slateSharedTriggerConfigPresenter);
    }),

  create: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateId: v.string(),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        status: v.optional(
          v.enumOf([
            SlateSharedTriggerConfigStatus.active,
            SlateSharedTriggerConfigStatus.paused
          ])
        ),
        destinationIds: v.optional(v.array(v.string())),
        triggers: v.optional(
          v.array(
            v.object({
              triggerId: v.string(),
              eventTypes: v.optional(v.array(v.string())),
              pollIntervalSecondsOverride: v.optional(v.nullable(v.number()))
            })
          )
        )
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.createSharedTriggerConfig({
          tenant: ctx.tenant,
          input: {
            slateId: ctx.input.slateId,
            name: ctx.input.name,
            description: ctx.input.description,
            status: ctx.input.status,
            destinationIds: ctx.input.destinationIds,
            triggers: ctx.input.triggers?.map(trigger => ({
              triggerId: trigger.triggerId,
              eventTypes: trigger.eventTypes,
              pollIntervalSecondsOverride: trigger.pollIntervalSecondsOverride
            }))
          }
        })
      )
    ),

  get: slateSharedTriggerConfigApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigId: v.string()
      })
    )
    .do(async ctx => slateSharedTriggerConfigPresenter(ctx.sharedTriggerConfig)),

  update: slateSharedTriggerConfigApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigId: v.string(),
        name: v.optional(v.nullable(v.string())),
        description: v.optional(v.nullable(v.string())),
        status: v.optional(
          v.enumOf([
            SlateSharedTriggerConfigStatus.active,
            SlateSharedTriggerConfigStatus.paused
          ])
        ),
        destinationIds: v.optional(v.array(v.string()))
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.updateSharedTriggerConfig({
          tenant: ctx.tenant,
          sharedTriggerConfigId: ctx.input.slateSharedTriggerConfigId,
          input: {
            name: ctx.input.name,
            description: ctx.input.description,
            status: ctx.input.status,
            destinationIds: ctx.input.destinationIds
          }
        })
      )
    ),

  delete: slateSharedTriggerConfigApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigId: v.string()
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.deleteSharedTriggerConfig({
          tenant: ctx.tenant,
          sharedTriggerConfigId: ctx.input.slateSharedTriggerConfigId
        })
      )
    ),

  triggerCreate: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigId: v.string(),
        triggerId: v.string(),
        eventTypes: v.optional(v.array(v.string())),
        pollIntervalSecondsOverride: v.optional(v.nullable(v.number()))
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.createSharedTriggerConfigTrigger({
          tenant: ctx.tenant,
          sharedTriggerConfigId: ctx.input.slateSharedTriggerConfigId,
          input: {
            triggerId: ctx.input.triggerId,
            eventTypes: ctx.input.eventTypes,
            pollIntervalSecondsOverride: ctx.input.pollIntervalSecondsOverride
          }
        })
      )
    ),

  triggerUpdate: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigTriggerId: v.string(),
        eventTypes: v.optional(v.array(v.string())),
        pollIntervalSecondsOverride: v.optional(v.nullable(v.number()))
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.updateSharedTriggerConfigTrigger({
          tenant: ctx.tenant,
          sharedTriggerConfigTriggerId: ctx.input.slateSharedTriggerConfigTriggerId,
          input: {
            eventTypes: ctx.input.eventTypes,
            pollIntervalSecondsOverride: ctx.input.pollIntervalSecondsOverride
          }
        })
      )
    ),

  triggerDelete: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateSharedTriggerConfigTriggerId: v.string()
      })
    )
    .do(async ctx =>
      slateSharedTriggerConfigPresenter(
        await slateSharedTriggerConfigService.deleteSharedTriggerConfigTrigger({
          tenant: ctx.tenant,
          sharedTriggerConfigTriggerId: ctx.input.slateSharedTriggerConfigTriggerId
        })
      )
    )
});
