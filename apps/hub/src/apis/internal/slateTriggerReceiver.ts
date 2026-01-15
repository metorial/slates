import { Paginator } from '@lowerdeck/pagination';
import { v } from '@lowerdeck/validation';
import { slateTriggerReceiverPresenter } from '../../presenters';
import { slateTriggerReceiverService } from '../../services';
import { app } from './_app';
import { tenantApp } from './tenant';

export let slateTriggerReceiverApp = tenantApp.use(async ctx => {
  let slateTriggerReceiverId = ctx.body.slateTriggerReceiverId;
  if (!slateTriggerReceiverId) throw new Error('Trigger receiver ID is required');

  let receiver = await slateTriggerReceiverService.getTriggerReceiverById({
    tenant: ctx.tenant,
    id: slateTriggerReceiverId
  });

  return { receiver };
});

export let slateTriggerReceiverController = app.controller({
  list: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateIds: v.optional(v.array(v.string())),
          slateInstanceIds: v.optional(v.array(v.string()))
        })
      )
    )
    .do(async ctx => {
      let paginator = await slateTriggerReceiverService.listTriggerReceivers({
        tenant: ctx.tenant,
        slateIds: ctx.input.slateIds,
        slateInstanceIds: ctx.input.slateInstanceIds
      });

      let list = await paginator.run(ctx.input);

      return Paginator.presentLight(list, slateTriggerReceiverPresenter);
    }),

  create: tenantApp
    .handler()
    .input(
      Paginator.validate(
        v.object({
          tenantId: v.string(),
          slateInstanceId: v.string(),
          authConfigId: v.optional(v.string()),
          name: v.optional(v.string()),
          description: v.optional(v.string()),
          eventTypes: v.optional(v.array(v.string())),
          destinations: v.array(v.string()),
          triggers: v.array(
            v.object({
              triggerId: v.string(),
              state: v.optional(v.record(v.any()))
            })
          )
        })
      )
    )
    .do(async ctx => {
      let receiver = await slateTriggerReceiverService.createTriggerReceiver({
        tenant: ctx.tenant,
        input: {
          slateInstanceId: ctx.input.slateInstanceId,
          authConfigId: ctx.input.authConfigId,
          name: ctx.input.name,
          description: ctx.input.description,
          eventTypes: ctx.input.eventTypes,
          destinations: ctx.input.destinations,
          triggers: ctx.input.triggers
        }
      });

      return slateTriggerReceiverPresenter(receiver);
    }),

  get: slateTriggerReceiverApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerReceiverId: v.string()
      })
    )
    .do(async ctx => slateTriggerReceiverPresenter(ctx.receiver)),

  update: slateTriggerReceiverApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerReceiverId: v.string(),
        authConfigId: v.optional(v.nullable(v.string())),
        name: v.optional(v.nullable(v.string())),
        description: v.optional(v.nullable(v.string())),
        eventTypes: v.optional(v.array(v.string())),
        destinations: v.optional(v.array(v.string())),
        triggers: v.optional(
          v.array(
            v.object({
              triggerId: v.string(),
              state: v.optional(v.record(v.any()))
            })
          )
        )
      })
    )
    .do(async ctx => {
      let receiver = await slateTriggerReceiverService.updateTriggerReceiver({
        tenant: ctx.tenant,
        receiverId: ctx.input.slateTriggerReceiverId,
        input: {
          authConfigId: ctx.input.authConfigId,
          name: ctx.input.name,
          description: ctx.input.description,
          eventTypes: ctx.input.eventTypes,
          destinations: ctx.input.destinations,
          triggers: ctx.input.triggers
        }
      });

      return slateTriggerReceiverPresenter(receiver);
    }),

  delete: slateTriggerReceiverApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerReceiverId: v.string()
      })
    )
    .do(async ctx => {
      let receiver = await slateTriggerReceiverService.deleteTriggerReceiver({
        tenant: ctx.tenant,
        receiverId: ctx.input.slateTriggerReceiverId
      });

      return slateTriggerReceiverPresenter(receiver);
    }),

  getMany: tenantApp
    .handler()
    .input(
      v.object({
        tenantId: v.string(),
        slateTriggerReceiverIds: v.array(v.string())
      })
    )
    .do(async ctx => {
      let receivers = await Promise.all(
        ctx.input.slateTriggerReceiverIds.map(id =>
          slateTriggerReceiverService.getTriggerReceiverById({
            tenant: ctx.tenant,
            id
          })
        )
      );

      return receivers.map(slateTriggerReceiverPresenter);
    })
});
