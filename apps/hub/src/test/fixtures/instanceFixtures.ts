import { randomBytes } from 'crypto';
import type {
  SlateConfigSchema,
  SlateInstance,
  SlateInstanceConfig,
} from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';

export class SlateConfigSchemaFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    specificationOid: bigint;
    overrides?: Partial<SlateConfigSchema>;
  }): Promise<SlateConfigSchema> {
    const { oid, id } = getId('slateConfigSchema');
    const identifier = `config-schema-${randomBytes(4).toString('hex')}`;

    return this.db.slateConfigSchema.create({
      data: {
        oid,
        id,
        identifier,
        hash: `hash_${randomBytes(8).toString('hex')}`,
        schema: {},
        slateOid: data.slateOid,
        mostRecentSpecificationOid: data.specificationOid,
        ...data.overrides,
      },
    });
  }
}

export class SlateInstanceConfigFixtures extends BaseFixture {
  async default(data: {
    instanceOid: bigint;
    schemaOid: bigint;
    tenantOid: bigint;
    value?: Record<string, unknown>;
    overrides?: Partial<SlateInstanceConfig>;
  }): Promise<SlateInstanceConfig> {
    const { oid, id } = getId('slateInstanceConfig');

    return this.db.slateInstanceConfig.create({
      data: {
        oid,
        id,
        instanceOid: data.instanceOid,
        schemaOid: data.schemaOid,
        tenantOid: data.tenantOid,
        value: data.value ?? {},
        ...data.overrides,
      },
    });
  }
}

export class SlateInstanceFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    tenantOid: bigint;
    overrides?: Partial<SlateInstance>;
  }): Promise<SlateInstance> {
    const { oid, id } = getId('slateInstance');

    return this.db.slateInstance.create({
      data: {
        oid,
        id,
        slateOid: data.slateOid,
        tenantOid: data.tenantOid,
        ...data.overrides,
      },
    });
  }

  async withConfig(data: {
    slateOid: bigint;
    tenantOid: bigint;
    specificationOid: bigint;
    configValue?: Record<string, unknown>;
    instanceOverrides?: Partial<SlateInstance>;
    schemaOverrides?: Partial<SlateConfigSchema>;
    configOverrides?: Partial<SlateInstanceConfig>;
  }): Promise<{
    instance: SlateInstance;
    configSchema: SlateConfigSchema;
    instanceConfig: SlateInstanceConfig;
  }> {
    const configSchemaFixtures = new SlateConfigSchemaFixtures(this.db);
    const configSchema = await configSchemaFixtures.default({
      slateOid: data.slateOid,
      specificationOid: data.specificationOid,
      overrides: data.schemaOverrides,
    });

    const instance = await this.default({
      slateOid: data.slateOid,
      tenantOid: data.tenantOid,
      overrides: data.instanceOverrides,
    });

    const instanceConfigFixtures = new SlateInstanceConfigFixtures(this.db);
    const instanceConfig = await instanceConfigFixtures.default({
      instanceOid: instance.oid,
      schemaOid: configSchema.oid,
      tenantOid: data.tenantOid,
      value: data.configValue,
      overrides: data.configOverrides,
    });

    await this.db.slateInstance.update({
      where: { oid: instance.oid },
      data: { currentConfigOid: instanceConfig.oid },
    });

    const updatedInstance = await this.db.slateInstance.findUniqueOrThrow({
      where: { oid: instance.oid },
    });

    return {
      instance: updatedInstance,
      configSchema,
      instanceConfig,
    };
  }
}
