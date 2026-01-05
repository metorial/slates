import { badRequestError, notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { getSentry } from '@lowerdeck/sentry';
import { Service } from '@lowerdeck/service';
import type { SlateInstance, SlateInstanceOAuthSetup } from '../../prisma/generated/browser';
import type { Slate, SlateOAuthCredentials, Tenant } from '../../prisma/generated/client';
import { db } from '../db';
import { ID, snowflake } from '../id';
import { validateJsonSchema } from '../lib/validateJsonSchema';
import { secretService, type SecretSlateInstanceOauthSetup } from './secret';

let Sentry = getSentry();

let include = {
  slate: true,
  slateAuthConfig: {
    include: {
      authMethod: true
    }
  },
  oauthCredentials: true
};

class slateInstanceOAuthSetupServiceImpl {
  async createSlateInstanceOAuthSetup(d: {
    tenant: Tenant;
    input: {
      oauthCredentials: SlateOAuthCredentials;
      slate: Slate;
      slateInstance?: SlateInstance;
      authMethodId?: string;
      redirectUrl: string;
      input: Record<string, any>;
    };
  }) {
    if (d.input.slateInstance && d.input.slateInstance.slateOid != d.input.slate.oid) {
      throw new ServiceError(
        badRequestError({
          message: 'Slate Instance does not belong to the provided Slate.'
        })
      );
    }

    let version = await this.getVersion({
      slate: d.input.slate,
      lockedVersionOid: d.input.slateInstance?.lockedSlateVersionOid ?? undefined
    });
    let authMethods = (version.specification?.slateAuthMethods ?? []).map(a => a.authMethod);

    let oauthAuthMethod = authMethods.find(m => m.type == 'oauth');
    if (!oauthAuthMethod) {
      throw new ServiceError(
        badRequestError({
          message: 'OAuth is not supported by this provider.'
        })
      );
    }

    let authMethod = d.input.authMethodId
      ? authMethods.find(
          m =>
            m.id == d.input.authMethodId ||
            m.type == d.input.authMethodId ||
            m.key == d.input.authMethodId
        )
      : oauthAuthMethod;

    if (!authMethod) {
      throw new ServiceError(notFoundError('slate.auth_method'));
    }

    let input = validateJsonSchema({
      schema: authMethod.spec.inputSchema,
      data: d.input.input,
      entity: 'oauth_setup.input',
      message: 'Invalid OAuth setup input.'
    });

    let secret = await secretService.createSecret({
      tenant: d.tenant,
      purpose: 'slate_oauth_setup',
      secretData: { input } satisfies SecretSlateInstanceOauthSetup
    });

    return await db.slateInstanceOAuthSetup.create({
      data: {
        oid: snowflake.nextId(),
        id: await ID.generateId('slateInstanceOAuthSetup'),
        status: 'unused',

        redirectUrl: d.input.redirectUrl,

        slateOid: d.input.slate.oid,
        tenantOid: d.tenant.oid,
        secretOid: secret.oid,
        oauthCredentialsOid: d.input.oauthCredentials.oid,
        authMethodOid: authMethod.oid,
        slateVersionOid: version.oid,
        slateInstanceOid: d.input.slateInstance?.oid
      },
      include
    });
  }

  async getSlateInstanceOAuthSetupById(d: { tenant: Tenant; id: string }) {
    let slateInstanceOAuthSetup = await db.slateInstanceOAuthSetup.findFirst({
      where: {
        tenantOid: d.tenant.oid,
        id: d.id
      },
      include
    });
    if (!slateInstanceOAuthSetup)
      throw new ServiceError(notFoundError('slate.instance.oauth_setup'));
    return slateInstanceOAuthSetup;
  }

  async listSlateInstanceOAuthSetups(d: { tenant: Tenant; slateIds?: string[] }) {
    let slates = d.slateIds
      ? await db.slate.findMany({
          where: {
            id: { in: d.slateIds }
          }
        })
      : undefined;

    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.slateInstanceOAuthSetup.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant.oid,
              slateOid: slates ? { in: slates.map(s => s.oid) } : undefined
            },
            include
          })
      )
    );
  }

  async getSlateInstanceOAuthSetupLogs(d: { setup: SlateInstanceOAuthSetup }) {
    return await db.slateInstanceOAuthSetup.findFirstOrThrow({
      where: { oid: d.setup.oid },
      include: {
        ...include,
        events: {
          include: {
            invocation: {
              include: {
                deployment: {
                  include: {
                    slateVersion: true
                  }
                }
              }
            }
          }
        }
      }
    });
  }

  private async getVersion(d: { slate: Slate; lockedVersionOid?: bigint }) {
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
        oid: d.lockedVersionOid ?? d.slate.currentVersionOid
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
    if (fullVersion.status != 'active' || !fullVersion.activeDeploymentOid) {
      throw new ServiceError(
        badRequestError({
          message: 'Provider version has not been deployed yet.'
        })
      );
    }

    return fullVersion;
  }
}

export let slateInstanceOAuthSetupService = Service.create(
  'slateInstanceOAuthSetupService',
  () => new slateInstanceOAuthSetupServiceImpl()
).build();
