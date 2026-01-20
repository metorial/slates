import { randomBytes } from 'crypto';
import type {
  Slate,
  Registry,
  SlateVersion,
  SlateSpecification
} from '../../../prisma/generated/client';
import { SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { RegistryFixtures } from './registryFixtures';
import { SlateVersionFixtures } from './slateVersionFixtures';

export class SlateFixtures extends BaseFixture {
  async default(data: {
    registryOid: bigint;
    identifier?: string;
    status?: SlateStatus;
    overrides?: Partial<Slate>;
  }): Promise<Slate> {
    const { oid, id } = getId('slate');
    const identifier = data.identifier || `test-slate-${randomBytes(4).toString('hex')}`;

    return this.db.slate.create({
      data: {
        oid,
        id,
        status: data.status || SlateStatus.active,
        identifier,
        name: `Test Slate ${identifier}`,
        description: 'A test slate',
        registryOid: data.registryOid,
        slateScopeIdentifierOnRegistry: 'test-scope',
        slateScopeIdOnRegistry: 'scope_123',
        slateFullIdentifierOnRegistry: `test-scope/${identifier}`,
        slateIdentifierOnRegistry: identifier,
        slateIdOnRegistry: `slate_${identifier}`,
        ...data.overrides
      }
    });
  }

  async withRegistry(data?: {
    registryOverrides?: Partial<Registry>;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    slateOverrides?: Partial<Slate>;
  }): Promise<Slate & { registry: Registry }> {
    const registryFixtures = new RegistryFixtures(this.db);
    const registry = await registryFixtures.default(data?.registryOverrides);

    const slate = await this.default({
      registryOid: registry.oid,
      identifier: data?.slateIdentifier,
      status: data?.slateStatus,
      overrides: data?.slateOverrides
    });

    return this.db.slate.findUniqueOrThrow({
      where: { id: slate.id },
      include: { registry: true }
    }) as Promise<Slate & { registry: Registry }>;
  }

  async complete(data?: {
    registryOverrides?: Partial<Registry>;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    slateOverrides?: Partial<Slate>;
    versionOverrides?: Partial<SlateVersion>;
    specificationOverrides?: Partial<SlateSpecification>;
  }): Promise<
    Slate & {
      registry: Registry;
      currentVersion: SlateVersion & { specification: SlateSpecification };
    }
  > {
    const slateWithRegistry = await this.withRegistry({
      registryOverrides: data?.registryOverrides,
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus,
      slateOverrides: data?.slateOverrides
    });

    const versionFixtures = new SlateVersionFixtures(this.db);
    const { version } = await versionFixtures.withSpecification({
      slateOid: slateWithRegistry.oid,
      registryOid: slateWithRegistry.registryOid,
      versionOverrides: data?.versionOverrides,
      specificationOverrides: data?.specificationOverrides
    });

    await this.db.slate.update({
      where: { oid: slateWithRegistry.oid },
      data: { currentVersionOid: version.oid }
    });

    return this.db.slate.findUniqueOrThrow({
      where: { id: slateWithRegistry.id },
      include: {
        registry: true,
        currentVersion: {
          include: { specification: true }
        }
      }
    }) as Promise<
      Slate & {
        registry: Registry;
        currentVersion: SlateVersion & { specification: SlateSpecification };
      }
    >;
  }

  async withoutVersion(data?: {
    registryOverrides?: Partial<Registry>;
    slateIdentifier?: string;
    slateOverrides?: Partial<Slate>;
  }): Promise<Slate & { registry: Registry; currentVersion: null }> {
    const slate = await this.withRegistry({
      registryOverrides: data?.registryOverrides,
      slateIdentifier: data?.slateIdentifier,
      slateOverrides: data?.slateOverrides
    });

    return this.db.slate.findUniqueOrThrow({
      where: { id: slate.id },
      include: {
        registry: true,
        currentVersion: true
      }
    }) as Promise<Slate & { registry: Registry; currentVersion: null }>;
  }
}
