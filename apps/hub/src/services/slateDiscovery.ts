import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type {
  Slate,
  SlateVersion,
  SlateVersionDiscovery
} from '../../prisma/generated/client';
import { db } from '../db';
import { functionBay, functionBayTenant } from '../functionBay';

let include = {
  slateVersion: {
    include: {
      specification: true,
      slate: {
        include: {
          registry: true
        }
      }
    }
  }
};

class slateVersionDiscoveryServiceImpl {
  async getSlateVersionDiscoveryById(d: { slateVersion: SlateVersion; id: string }) {
    let slateVersionDiscovery = await db.slateVersionDiscovery.findFirst({
      where: {
        slateVersionOid: d.slateVersion.oid,
        id: d.id
      },
      include
    });
    if (!slateVersionDiscovery)
      throw new ServiceError(notFoundError('slate.version_discovery'));
    return slateVersionDiscovery;
  }

  async getBuildOutput(d: { slateVersionDiscovery: SlateVersionDiscovery }) {
    if (!d.slateVersionDiscovery.invocationOid) return null;

    let invocation = await db.slateInvocation.findFirstOrThrow({
      where: {
        oid: d.slateVersionDiscovery.invocationOid
      }
    });

    let version = await db.slateVersion.findFirstOrThrow({
      where: {
        oid: d.slateVersionDiscovery.slateVersionOid
      }
    });
    if (!version.providerDeploymentInfo) {
      throw new ServiceError(badRequestError({ message: 'Version not deployed' }));
    }

    return await functionBay.functionInvocation.get({
      tenantId: functionBayTenant.id,
      functionId: version.providerDeploymentInfo.functionId,
      functionInvocationId: invocation.providerInvocationId
    });
  }

  async listSlateVersionDiscoveries(d: { slate: Slate; versionIds?: string[] }) {
    let versions = d.versionIds
      ? await db.slateVersion.findMany({
          where: {
            slateOid: d.slate.oid,
            OR: [{ id: { in: d.versionIds } }, { version: { in: d.versionIds } }]
          }
        })
      : await db.slateVersion.findMany({
          where: { slateOid: d.slate.oid }
        });

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateVersionDiscovery.findMany({
            ...opts,
            where: {
              slateVersionOid: { in: versions.map(v => v.oid) }
            },
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }

  async listAllDiscoveries(d: { status?: 'succeeded' | 'failed' }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateVersionDiscovery.findMany({
            ...opts,
            where: d.status ? { status: d.status } : undefined,
            orderBy: { createdAt: 'desc' },
            include
          })
      )
    );
  }

  async getToolCallStats(d: { slateVersionDiscovery: SlateVersionDiscovery }) {
    let slateVersion = await db.slateVersion.findFirstOrThrow({
      where: { oid: d.slateVersionDiscovery.slateVersionOid }
    });

    let toolCalls = await db.slateSessionToolCall.groupBy({
      by: ['actionOid', 'status'],
      where: { slateVersionOid: slateVersion.oid },
      _count: { _all: true }
    });

    let actionOids = [...new Set(toolCalls.map(tc => tc.actionOid))];
    let actions = await db.slateAction.findMany({
      where: { oid: { in: actionOids } }
    });

    let actionMap = new Map(actions.map(a => [Number(a.oid), a]));

    let stats: Record<string, { total: number; succeeded: number; failed: number }> = {};

    for (let tc of toolCalls) {
      let action = actionMap.get(Number(tc.actionOid));
      if (!action) continue;

      if (!stats[action.key]) {
        stats[action.key] = { total: 0, succeeded: 0, failed: 0 };
      }

      let stat = stats[action.key]!;
      stat.total += tc._count._all;
      if (tc.status === 'succeeded') {
        stat.succeeded += tc._count._all;
      } else {
        stat.failed += tc._count._all;
      }
    }

    let totalCalls = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
    let totalSucceeded = Object.values(stats).reduce((sum, s) => sum + s.succeeded, 0);
    let totalFailed = Object.values(stats).reduce((sum, s) => sum + s.failed, 0);

    return {
      total: totalCalls,
      succeeded: totalSucceeded,
      failed: totalFailed,
      byTool: stats
    };
  }

  async getSpecification(d: { slateVersionDiscovery: SlateVersionDiscovery }) {
    if (!d.slateVersionDiscovery.specificationOid) return null;

    let specification = await db.slateSpecification.findFirst({
      where: { oid: d.slateVersionDiscovery.specificationOid },
      include: {
        slateActions: {
          include: { action: true }
        },
        slateAuthMethods: {
          include: { authMethod: true }
        },
        slateConfigSchemas: {
          include: { configSchema: true }
        }
      }
    });

    if (!specification) return null;

    return {
      provider: {
        name: specification.name,
        key: specification.key,
        protocolVersion: specification.protocolVersion
      },
      tools: specification.slateActions
        .map(sa => sa.action)
        .filter(a => a.type === 'tool')
        .map(a => ({
          key: a.key,
          name: a.name,
          description: (a.spec as any)?.description,
          inputSchema: (a.spec as any)?.inputSchema,
          outputSchema: (a.spec as any)?.outputSchema
        })),
      triggers: specification.slateActions
        .map(sa => sa.action)
        .filter(a => a.type === 'trigger')
        .map(a => ({
          key: a.key,
          name: a.name,
          description: (a.spec as any)?.description,
          inputSchema: (a.spec as any)?.inputSchema,
          outputSchema: (a.spec as any)?.outputSchema
        })),
      authMethods: specification.slateAuthMethods.map(sam => sam.authMethod).map(am => ({
        key: am.key,
        name: am.name,
        type: am.type,
        scopes: (am.spec as any)?.scopes,
        capabilities: (am.spec as any)?.capabilities,
        inputSchema: (am.spec as any)?.inputSchema,
        outputSchema: (am.spec as any)?.outputSchema
      })),
      configSchema: specification.slateConfigSchemas[0]?.configSchema?.schema ?? null
    };
  }
}

export let slateVersionDiscoveryService = Service.create(
  'slateVersionDiscoveryService',
  () => new slateVersionDiscoveryServiceImpl()
).build();
