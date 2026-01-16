import { randomBytes } from 'crypto';
import type { SlateSpecification } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class SlateSpecificationFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    versionOid: bigint;
    identifier?: string;
    overrides?: Partial<SlateSpecification>;
  }): Promise<SlateSpecification> {
    const { oid, id } = getId('slateSpecification');
    const identifier =
      data.identifier || `spec-${randomBytes(4).toString('hex')}`;

    return this.db.slateSpecification.create({
      data: {
        oid,
        id,
        identifier,
        hash: randomBytes(16).toString('hex'),
        name: 'Test Spec',
        key: 'test-spec',
        protocolVersion: '1.0',
        providerInfo: {},
        configSchema: {},
        authMethods: {},
        actions: {},
        slateOid: data.slateOid,
        mostRecentVersionOid: data.versionOid,
        ...data.overrides,
      },
    });
  }
}
