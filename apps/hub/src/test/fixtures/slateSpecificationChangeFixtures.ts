import type {
  SlateSpecificationChange,
  Slate,
  SlateVersion,
  SlateSpecification
} from '../../../prisma/generated/client';
import { SlateSpecificationChangeType, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';
import { SlateVersionFixtures } from './slateVersionFixtures';

export class SlateSpecificationChangeFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    fromVersionOid: bigint;
    toVersionOid: bigint;
    fromSpecificationOid: bigint;
    toSpecificationOid: bigint;
    type?: SlateSpecificationChangeType;
    overrides?: Partial<SlateSpecificationChange>;
  }): Promise<SlateSpecificationChange> {
    const { oid, id } = getId('slateSpecificationChange');

    return this.db.slateSpecificationChange.create({
      data: {
        oid,
        id,
        type: data.type ?? SlateSpecificationChangeType.between_versions,
        slateOid: data.slateOid,
        fromVersionOid: data.fromVersionOid,
        toVersionOid: data.toVersionOid,
        fromSpecificationOid: data.fromSpecificationOid,
        toSpecificationOid: data.toSpecificationOid,
        ...data.overrides
      }
    });
  }

  async withVersions(data?: {
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    type?: SlateSpecificationChangeType;
    changeOverrides?: Partial<SlateSpecificationChange>;
  }): Promise<{
    change: SlateSpecificationChange;
    slate: Slate;
    fromVersion: SlateVersion & { specification: SlateSpecification };
    toVersion: SlateVersion & { specification: SlateSpecification };
  }> {
    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const versionFixtures = new SlateVersionFixtures(this.db);
    const { version: toVersion } = await versionFixtures.withSpecification({
      slateOid: slate.oid,
      registryOid: slate.registryOid,
      versionOverrides: { version: '2.0.0' }
    });

    const toVersionWithSpec = await this.db.slateVersion.findUniqueOrThrow({
      where: { oid: toVersion.oid },
      include: { specification: true }
    });

    const fromVersionWithSpec = await this.db.slateVersion.findUniqueOrThrow({
      where: { oid: slate.currentVersion.oid },
      include: { specification: true }
    });

    const change = await this.default({
      slateOid: slate.oid,
      fromVersionOid: slate.currentVersion.oid,
      toVersionOid: toVersion.oid,
      fromSpecificationOid: fromVersionWithSpec.specification!.oid,
      toSpecificationOid: toVersionWithSpec.specification!.oid,
      type: data?.type,
      overrides: data?.changeOverrides
    });

    return {
      change,
      slate,
      fromVersion: fromVersionWithSpec as SlateVersion & { specification: SlateSpecification },
      toVersion: toVersionWithSpec as SlateVersion & { specification: SlateSpecification }
    };
  }
}
