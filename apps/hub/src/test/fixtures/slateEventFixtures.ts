import type { SlateEvent, Slate, SlateVersion } from '../../../prisma/generated/client';
import { SlateEventType, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';

export class SlateEventFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    slateVersionOid: bigint;
    type?: SlateEventType;
    overrides?: Partial<SlateEvent>;
  }): Promise<SlateEvent> {
    const { oid, id } = getId('slateEvent');
    const type = data.type ?? SlateEventType.version_pulled;

    return this.db.slateEvent.create({
      data: {
        oid,
        id,
        type,
        message: `Event: ${type}`,
        slateOid: data.slateOid,
        slateVersionOid: data.slateVersionOid,
        ...data.overrides
      }
    });
  }

  async withSlate(data?: {
    type?: SlateEventType;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    eventOverrides?: Partial<SlateEvent>;
  }): Promise<{
    event: SlateEvent;
    slate: Slate & { currentVersion: SlateVersion };
  }> {
    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const event = await this.default({
      slateOid: slate.oid,
      slateVersionOid: slate.currentVersion.oid,
      type: data?.type,
      overrides: data?.eventOverrides
    });

    return { event, slate };
  }
}
