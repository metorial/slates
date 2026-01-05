import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { getSentry } from '@lowerdeck/sentry';
import { Service } from '@lowerdeck/service';
import type { Slate, SlateInstance, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { ID, snowflake } from '../id';
import { extractExpiresAt } from '../lib/extractExpiresAt';
import { validateJsonSchema } from '../lib/validateJsonSchema';
import { processAuthQueue } from '../queues/instance/processAuth';
import { secretService } from './secret';

let Sentry = getSentry();

let include = {
  slate: true,
  authMethod: true,
  instance: true,
  oauthCredentials: true
};

class slateAuthConfigServiceImpl {
  async createSlateAuthConfig(d: {
    tenant: Tenant;
    slate: Slate;
    slateInstance?: SlateInstance;
    input: {
      authMethodId?: string;
      authConfig: Record<string, any>;
    };
  }) {
    let fullVersion = await this.getVersion({
      slateInstance: d.slateInstance,
      slate: d.slate
    });

    let defaultAuthMethod =
      fullVersion.specification?.slateAuthMethods.find(m => m.authMethod.type == 'token') ??
      fullVersion.specification?.slateAuthMethods[0];

    let method = d.input.authMethodId
      ? fullVersion.specification?.slateAuthMethods.find(
          m =>
            m.authMethod.id == d.input.authMethodId ||
            m.authMethod.type == d.input.authMethodId ||
            m.authMethod.key == d.input.authMethodId
        )
      : defaultAuthMethod;
    if (!method) {
      if (d.input.authMethodId) {
        throw new ServiceError(
          badRequestError({
            message: 'Invalid authentication method ID.'
          })
        );
      }

      throw new ServiceError(
        badRequestError({
          message: 'No authentication methods are configured for this provider.'
        })
      );
    }

    // For oauth we use the output schema since we are manually setting oauth credentials here
    let schema =
      method.authMethod.type == 'oauth'
        ? method.authMethod.spec.outputSchema
        : method.authMethod.spec.inputSchema;

    let storedConfig = d.input.authConfig;
    if (method.authMethod.type == 'oauth') {
      storedConfig.refreshToken = '0'; // Placeholder to pass schema validation

      if (schema?.properties?.expiresAt) {
        schema.required = [...new Set([...(schema.required ?? []), 'expiresAt'])];
      }
    }

    storedConfig = validateJsonSchema({
      schema,
      data: storedConfig,
      entity: 'provider.auth_config',
      message: 'Invalid provider authentication configuration.'
    });

    let configId = await ID.generateId('slateAuthConfig');
    let secret = await secretService.createSecret({
      tenant: d.tenant,
      purpose: 'slate_authentication_configuration',
      secretData:
        method.authMethod.type == 'oauth' ? { output: storedConfig } : { input: storedConfig }
    });

    let tokenExpiresAt = extractExpiresAt(storedConfig);

    let config = await db.slateAuthConfig.create({
      data: {
        oid: snowflake.nextId(),
        id: configId,
        type: method.authMethod.type == 'oauth' ? 'oauth_manual' : 'manual',
        isProcessing: true,
        tokenExpiresAt,

        instanceOid: d.slateInstance?.oid,
        slateOid: d.slate.oid,
        authMethodOid: method.authMethod.oid,
        tenantOid: d.tenant.oid,
        secretOid: secret.oid
      },
      include
    });

    await processAuthQueue.add({
      configId: config.id
    });

    return config;
  }

  async getSlateAuthConfigById(d: { tenant: Tenant; id: string }) {
    let slateAuthConfig = await db.slateAuthConfig.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.id
      },
      include
    });
    if (!slateAuthConfig) throw new ServiceError(notFoundError('slate.instance.auth_config'));
    return slateAuthConfig;
  }

  async listSlateAuthConfigs(d: {
    tenant: Tenant;
    slateInstanceIds?: string[];
    slateIds?: string[];
  }) {
    let slateInstances = d.slateInstanceIds
      ? await db.slateInstance.findMany({
          where: { id: { in: d.slateInstanceIds }, tenantOid: d.tenant.oid }
        })
      : undefined;
    let slates = d.slateIds
      ? await db.slate.findMany({
          where: { id: { in: d.slateIds } }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateAuthConfig.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant.oid,

              instanceOid: slateInstances
                ? { in: slateInstances.map(si => si.oid) }
                : undefined,

              slateOid: slates ? { in: slates.map(s => s.oid) } : undefined
            },
            include
          })
      )
    );
  }

  private async getVersion(d: { slateInstance?: SlateInstance; slate: Slate }) {
    if (!d.slate.currentVersionOid) {
      throw new ServiceError(
        badRequestError({
          message: 'Provider does not have a current version set.'
        })
      );
    }

    let fullVersion = await db.slateVersion.findFirstOrThrow({
      where: {
        slateOid: d.slate.oid,
        oid: d.slateInstance?.lockedSlateVersionOid ?? d.slate.currentVersionOid
      },
      include: {
        specification: {
          include: {
            slateAuthMethods: {
              include: {
                authMethod: true
              }
            }
          }
        }
      }
    });
    if (fullVersion.status != 'active' || !fullVersion.specification) {
      throw new ServiceError(
        badRequestError({
          message: 'Provider version has not been deployed yet.'
        })
      );
    }

    return fullVersion;
  }
}

export let slateAuthConfigService = Service.create(
  'slateAuthConfigService',
  () => new slateAuthConfigServiceImpl()
).build();
