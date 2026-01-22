import { randomBytes } from 'crypto';
import type {
  SlateAuthMethod,
  Slate,
  SlateSpecification
} from '../../../prisma/generated/client';
import { SlateAuthMethodType, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';

export class SlateAuthMethodFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    specificationOid: bigint;
    type?: SlateAuthMethodType;
    overrides?: Partial<SlateAuthMethod>;
  }): Promise<SlateAuthMethod> {
    const { oid, id } = getId('slateAuthMethod');
    const key = `auth-method-${randomBytes(4).toString('hex')}`;

    const authType = data.type ?? SlateAuthMethodType.oauth;
    const specType = `auth.${authType}` as const;

    return this.db.slateAuthMethod.create({
      data: {
        oid,
        id,
        type: authType,
        identifier: `auth-method-${randomBytes(8).toString('hex')}`,
        hash: `hash_${randomBytes(16).toString('hex')}`,
        key,
        name: `Test Auth Method ${key}`,
        spec: {
          id: key,
          name: `Test Auth Method ${key}`,
          type: specType,
          inputSchema: {},
          outputSchema: {},
          capabilities: {}
        },
        slateOid: data.slateOid,
        mostRecentSpecificationOid: data.specificationOid,
        ...data.overrides
      }
    });
  }

  async withSlate(data?: {
    type?: SlateAuthMethodType;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    authMethodOverrides?: Partial<SlateAuthMethod>;
  }): Promise<{
    authMethod: SlateAuthMethod;
    slate: Slate & { currentVersion: { specification: SlateSpecification } };
  }> {
    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const authMethod = await this.default({
      slateOid: slate.oid,
      specificationOid: slate.currentVersion.specification.oid,
      type: data?.type,
      overrides: data?.authMethodOverrides
    });

    return { authMethod, slate };
  }
}
