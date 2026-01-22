import type {
  SlateVersionDiscovery,
  Slate,
  SlateVersion,
  SlateSpecification
} from '../../../prisma/generated/client';
import { SlateVersionDiscoveryStatus, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';

export class SlateVersionDiscoveryFixtures extends BaseFixture {
  async default(data: {
    slateVersionOid: bigint;
    specificationOid?: bigint;
    status?: SlateVersionDiscoveryStatus;
    overrides?: Partial<SlateVersionDiscovery>;
  }): Promise<SlateVersionDiscovery> {
    const { oid, id } = getId('slateVersionDiscovery');

    return this.db.slateVersionDiscovery.create({
      data: {
        oid,
        id,
        status: data.status ?? SlateVersionDiscoveryStatus.succeeded,
        slateVersionOid: data.slateVersionOid,
        specificationOid: data.specificationOid,
        ...data.overrides
      }
    });
  }

  async withSlate(data?: {
    status?: SlateVersionDiscoveryStatus;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    discoveryOverrides?: Partial<SlateVersionDiscovery>;
  }): Promise<{
    discovery: SlateVersionDiscovery;
    slate: Slate & { currentVersion: SlateVersion & { specification: SlateSpecification } };
  }> {
    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const discovery = await this.default({
      slateVersionOid: slate.currentVersion.oid,
      specificationOid: slate.currentVersion.specification.oid,
      status: data?.status,
      overrides: data?.discoveryOverrides
    });

    return { discovery, slate };
  }

  async failed(data: {
    slateVersionOid: bigint;
    errorMessage?: string;
    overrides?: Partial<SlateVersionDiscovery>;
  }): Promise<SlateVersionDiscovery> {
    return this.default({
      slateVersionOid: data.slateVersionOid,
      status: SlateVersionDiscoveryStatus.failed,
      overrides: {
        errorMessage: data.errorMessage ?? 'Discovery failed',
        ...data.overrides
      }
    });
  }
}
