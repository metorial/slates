import { randomBytes } from 'crypto';
import type { Tenant } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class TenantFixtures extends BaseFixture {
  async default(overrides?: Partial<Tenant>): Promise<Tenant> {
    const { oid, id } = getId('tenant');
    const identifier = `test-tenant-${randomBytes(4).toString('hex')}`;

    return this.db.tenant.create({
      data: {
        oid,
        id,
        identifier,
        name: `Test Tenant ${identifier}`,
        ...overrides,
      },
    });
  }

  async withIdentifier(
    identifier: string,
    overrides?: Partial<Tenant>
  ): Promise<Tenant> {
    return this.default({
      identifier,
      name: `Tenant ${identifier}`,
      ...overrides,
    });
  }
}
