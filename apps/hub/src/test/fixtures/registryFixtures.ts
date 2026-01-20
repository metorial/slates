import { randomBytes } from 'crypto';
import type { Registry } from '../../../prisma/generated/client';
import { RegistryStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class RegistryFixtures extends BaseFixture {
  async default(overrides?: Partial<Registry>): Promise<Registry> {
    const { oid, id } = getId('registry');

    return this.db.registry.create({
      data: {
        oid,
        id,
        identifier: overrides?.identifier || `test-registry-${randomBytes(4).toString('hex')}`,
        name: 'Test Registry',
        url: 'http://localhost:52040',
        status: RegistryStatus.active,
        isPredefined: false,
        ...overrides
      }
    });
  }

  async withStatus(status: RegistryStatus, overrides?: Partial<Registry>): Promise<Registry> {
    return this.default({ ...overrides, status });
  }

  async disabled(overrides?: Partial<Registry>): Promise<Registry> {
    return this.withStatus(RegistryStatus.disabled, overrides);
  }
}
