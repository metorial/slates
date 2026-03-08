import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import {
  SlateSharedTriggerConfigStatus,
  SlateTriggerDestinationStatus,
  type Slate,
  type Tenant
} from '../../prisma/generated/client';
import { db } from '../db';
import { getId, snowflake } from '../id';

let sharedConfigInclude = {
  slate: true,
  destinations: {
    include: {
      destination: true
    }
  },
  triggers: {
    include: {
      action: true
    }
  }
};

let normalizeEventTypes = (eventTypes?: string[] | null) =>
  eventTypes && eventTypes.length > 0 ? [...new Set(eventTypes)] : [];

class slateSharedTriggerConfigServiceImpl {
  private normalizePollIntervalOverride(value?: number | null) {
    if (value === undefined || value === null) return value;
    if (!Number.isInteger(value) || value < 1) {
      throw new ServiceError(
        badRequestError({
          code: 'invalid_poll_interval_override',
          message: 'pollIntervalSecondsOverride must be a positive integer.'
        })
      );
    }

    return value;
  }

  private async getSlateForTenant(d: { tenant: Tenant; slateId: string }) {
    let slate = await db.slate.findFirst({
      where: {
        id: d.slateId
      }
    });
    if (!slate) throw new ServiceError(notFoundError('slate', d.slateId));
    return slate;
  }

  private async resolveDestinations(d: { tenant: Tenant; destinationIds: string[] }) {
    let destinationIds = [...new Set(d.destinationIds)];
    let destinations = await db.slateTriggerDestination.findMany({
      where: {
        tenantOid: d.tenant.oid,
        id: { in: destinationIds },
        status: SlateTriggerDestinationStatus.active
      }
    });

    if (destinations.length !== destinationIds.length) {
      throw new ServiceError(
        badRequestError({
          code: 'invalid_destination',
          message: 'One or more trigger destinations were not found.'
        })
      );
    }

    return destinations;
  }

  private async resolveTriggerActions(d: { slate: Slate; triggerIds: string[] }) {
    let actions = await db.slateAction.findMany({
      where: {
        type: 'trigger',
        slateOid: d.slate.oid,
        OR: [
          { id: { in: d.triggerIds } },
          { key: { in: d.triggerIds } },
          { identifier: { in: d.triggerIds } }
        ]
      }
    });

    let byId = new Map(actions.map(action => [action.id, action] as const));
    let byKey = new Map(actions.map(action => [action.key, action] as const));
    let byIdentifier = new Map(actions.map(action => [action.identifier, action] as const));

    return d.triggerIds.map(triggerId => {
      let action = byId.get(triggerId) || byKey.get(triggerId) || byIdentifier.get(triggerId);
      if (!action) {
        throw new ServiceError(
          badRequestError({
            code: 'invalid_trigger_action',
            message: `Trigger action not found: ${triggerId}`
          })
        );
      }

      return action;
    });
  }

  async getSharedTriggerConfigById(d: { tenant: Tenant; id: string }) {
    let config = await db.slateSharedTriggerConfig.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.id
      },
      include: sharedConfigInclude
    });
    if (!config) throw new ServiceError(notFoundError('slate.shared_trigger_config'));
    return config;
  }

  async listSharedTriggerConfigs(d: { tenant: Tenant; slateIds?: string[] }) {
    let slates = d.slateIds?.length
      ? await db.slate.findMany({
          where: {
            id: { in: d.slateIds }
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(async opts =>
        db.slateSharedTriggerConfig.findMany({
          ...opts,
          where: {
            tenantOid: d.tenant.oid,
            slateOid: slates ? { in: slates.map(slate => slate.oid) } : undefined
          },
          include: sharedConfigInclude
        })
      )
    );
  }

  async createSharedTriggerConfig(d: {
    tenant: Tenant;
    input: {
      slateId: string;
      name?: string;
      description?: string;
      status?: SlateSharedTriggerConfigStatus;
      destinationIds?: string[];
      triggers?: {
        triggerId: string;
        eventTypes?: string[];
        pollIntervalSecondsOverride?: number | null;
      }[];
    };
  }) {
    let slate = await this.getSlateForTenant({
      tenant: d.tenant,
      slateId: d.input.slateId
    });
    let destinations = d.input.destinationIds?.length
      ? await this.resolveDestinations({
          tenant: d.tenant,
          destinationIds: d.input.destinationIds
        })
      : [];
    let actions = d.input.triggers?.length
      ? await this.resolveTriggerActions({
          slate,
          triggerIds: d.input.triggers.map(trigger => trigger.triggerId)
        })
      : [];

    let config = await db.slateSharedTriggerConfig.create({
      data: {
        ...getId('slateSharedTriggerConfig'),
        tenantOid: d.tenant.oid,
        slateOid: slate.oid,
        status: d.input.status ?? SlateSharedTriggerConfigStatus.active,
        name: d.input.name,
        description: d.input.description,
        destinations: destinations.length
          ? {
              createMany: {
                data: destinations.map(destination => ({
                  oid: snowflake.nextId(),
                  destinationOid: destination.oid
                }))
              }
            }
          : undefined,
        triggers: actions.length
          ? {
              createMany: {
                data: actions.map((action, index) => ({
                  ...getId('slateSharedTriggerConfigTrigger'),
                  actionOid: action.oid,
                  eventTypes: normalizeEventTypes(d.input.triggers?.[index]?.eventTypes),
                  pollIntervalSecondsOverride: this.normalizePollIntervalOverride(
                    d.input.triggers?.[index]?.pollIntervalSecondsOverride
                  )
                }))
              }
            }
          : undefined
      },
      include: sharedConfigInclude
    });

    return config;
  }

  async updateSharedTriggerConfig(d: {
    tenant: Tenant;
    sharedTriggerConfigId: string;
    input: {
      name?: string | null;
      description?: string | null;
      status?: SlateSharedTriggerConfigStatus;
      destinationIds?: string[];
    };
  }) {
    let config = await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: d.sharedTriggerConfigId
    });

    await db.slateSharedTriggerConfig.update({
      where: { oid: config.oid },
      data: {
        name: d.input.name === null ? null : d.input.name,
        description: d.input.description === null ? null : d.input.description,
        status: d.input.status
      }
    });

    if (d.input.destinationIds) {
      let destinations = await this.resolveDestinations({
        tenant: d.tenant,
        destinationIds: d.input.destinationIds
      });
      let incoming = new Set(destinations.map(destination => destination.oid.toString()));
      let current = new Set(
        config.destinations.map(destination => destination.destinationOid.toString())
      );

      let toAdd = destinations.filter(destination => !current.has(destination.oid.toString()));
      let toRemove = config.destinations.filter(
        destination => !incoming.has(destination.destinationOid.toString())
      );

      if (toAdd.length) {
        await db.slateSharedTriggerConfigDestination.createMany({
          data: toAdd.map(destination => ({
            oid: snowflake.nextId(),
            sharedConfigOid: config.oid,
            destinationOid: destination.oid
          })),
          skipDuplicates: true
        });
      }

      if (toRemove.length) {
        await db.slateSharedTriggerConfigDestination.deleteMany({
          where: {
            oid: {
              in: toRemove.map(destination => destination.oid)
            }
          }
        });
      }
    }

    return await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: config.id
    });
  }

  async deleteSharedTriggerConfig(d: { tenant: Tenant; sharedTriggerConfigId: string }) {
    let config = await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: d.sharedTriggerConfigId
    });

    await db.slateSharedTriggerConfig.delete({
      where: { oid: config.oid }
    });

    return config;
  }

  async createSharedTriggerConfigTrigger(d: {
    tenant: Tenant;
    sharedTriggerConfigId: string;
    input: {
      triggerId: string;
      eventTypes?: string[];
      pollIntervalSecondsOverride?: number | null;
    };
  }) {
    let config = await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: d.sharedTriggerConfigId
    });
    let [action] = await this.resolveTriggerActions({
      slate: config.slate,
      triggerIds: [d.input.triggerId]
    });
    if (!action) {
      throw new ServiceError(notFoundError('slate.action', d.input.triggerId));
    }

    await db.slateSharedTriggerConfigTrigger.create({
      data: {
        ...getId('slateSharedTriggerConfigTrigger'),
        sharedConfigOid: config.oid,
        actionOid: action.oid,
        eventTypes: normalizeEventTypes(d.input.eventTypes),
        pollIntervalSecondsOverride: this.normalizePollIntervalOverride(
          d.input.pollIntervalSecondsOverride
        )
      }
    });

    return await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: config.id
    });
  }

  async updateSharedTriggerConfigTrigger(d: {
    tenant: Tenant;
    sharedTriggerConfigTriggerId: string;
    input: {
      eventTypes?: string[];
      pollIntervalSecondsOverride?: number | null;
    };
  }) {
    let trigger = await db.slateSharedTriggerConfigTrigger.findFirst({
      where: {
        id: d.sharedTriggerConfigTriggerId,
        sharedConfig: {
          tenantOid: d.tenant.oid
        }
      },
      include: {
        sharedConfig: true
      }
    });
    if (!trigger) {
      throw new ServiceError(notFoundError('slate.shared_trigger_config_trigger'));
    }

    await db.slateSharedTriggerConfigTrigger.update({
      where: { oid: trigger.oid },
      data: {
        eventTypes:
          d.input.eventTypes !== undefined
            ? normalizeEventTypes(d.input.eventTypes)
            : undefined,
        pollIntervalSecondsOverride:
          d.input.pollIntervalSecondsOverride !== undefined
            ? this.normalizePollIntervalOverride(d.input.pollIntervalSecondsOverride)
            : undefined
      }
    });

    return await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: trigger.sharedConfig.id
    });
  }

  async deleteSharedTriggerConfigTrigger(d: {
    tenant: Tenant;
    sharedTriggerConfigTriggerId: string;
  }) {
    let trigger = await db.slateSharedTriggerConfigTrigger.findFirst({
      where: {
        id: d.sharedTriggerConfigTriggerId,
        sharedConfig: {
          tenantOid: d.tenant.oid
        }
      },
      include: {
        sharedConfig: true
      }
    });
    if (!trigger) {
      throw new ServiceError(notFoundError('slate.shared_trigger_config_trigger'));
    }

    await db.slateSharedTriggerConfigTrigger.delete({
      where: { oid: trigger.oid }
    });

    return await this.getSharedTriggerConfigById({
      tenant: d.tenant,
      id: trigger.sharedConfig.id
    });
  }
}

export let slateSharedTriggerConfigService = Service.create(
  'slateSharedTriggerConfigService',
  () => new slateSharedTriggerConfigServiceImpl()
).build();
