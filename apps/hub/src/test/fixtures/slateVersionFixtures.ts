import type {
  SlateVersion,
  SlateSpecification,
} from '../../../prisma/generated/client';
import { SlateVersionStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';

export class SlateVersionFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    registryOid: bigint;
    version?: string;
    overrides?: Partial<SlateVersion>;
  }): Promise<SlateVersion> {
    const { oid, id } = getId('slateVersion');
    const version = data.version || '1.0.0';

    return this.db.slateVersion.create({
      data: {
        oid,
        id,
        status: SlateVersionStatus.active,
        isCurrent: true,
        willBeCurrent: false,
        version,
        versionIdOnRegistry: `ver_${Date.now()}`,
        versionIdentifierOnRegistry: version,
        manifest: {},
        providerDeploymentInfo: {},
        slateOid: data.slateOid,
        registryOid: data.registryOid,
        specificationOid: null,
        ...data.overrides,
      },
    });
  }

  async withSpecification(data: {
    slateOid: bigint;
    registryOid: bigint;
    version?: string;
    versionOverrides?: Partial<SlateVersion>;
    specificationOverrides?: Partial<SlateSpecification>;
  }): Promise<{
    version: SlateVersion & { specification: SlateSpecification };
    specification: SlateSpecification;
  }> {
    const version = await this.default({
      slateOid: data.slateOid,
      registryOid: data.registryOid,
      version: data.version,
      overrides: data.versionOverrides,
    });

    const specFixtures = new SlateSpecificationFixtures(this.db);
    const specification = await specFixtures.default({
      slateOid: data.slateOid,
      versionOid: version.oid,
      overrides: data.specificationOverrides,
    });

    await this.db.slateVersion.update({
      where: { oid: version.oid },
      data: { specificationOid: specification.oid },
    });

    const versionWithSpec = await this.db.slateVersion.findUniqueOrThrow({
      where: { oid: version.oid },
      include: { specification: true },
    });

    return {
      version: versionWithSpec as SlateVersion & {
        specification: SlateSpecification;
      },
      specification,
    };
  }
}
