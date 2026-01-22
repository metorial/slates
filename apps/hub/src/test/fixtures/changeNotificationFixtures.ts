import type {
  ChangeNotification,
  Slate,
  SlateVersion
} from '../../../prisma/generated/client';
import { ChangeNotificationType, SlateStatus } from '../../../prisma/generated/client';
import { getId } from '../../id';
import { BaseFixture } from './base';
import { SlateFixtures } from './slateFixtures';

export class ChangeNotificationFixtures extends BaseFixture {
  async default(data: {
    slateOid: bigint;
    slateId: string;
    slateVersionOid?: bigint;
    slateVersionId?: string;
    type?: ChangeNotificationType;
    overrides?: Partial<ChangeNotification>;
  }): Promise<ChangeNotification> {
    const { oid, id } = getId('changeNotification');

    return this.db.changeNotification.create({
      data: {
        oid,
        id,
        type: data.type ?? ChangeNotificationType.slate_version_created,
        slateOid: data.slateOid,
        slateId: data.slateId,
        slateVersionOid: data.slateVersionOid,
        slateVersionId: data.slateVersionId,
        ...data.overrides
      }
    });
  }

  async withSlate(data?: {
    type?: ChangeNotificationType;
    slateIdentifier?: string;
    slateStatus?: SlateStatus;
    notificationOverrides?: Partial<ChangeNotification>;
  }): Promise<{
    notification: ChangeNotification;
    slate: Slate & { currentVersion: SlateVersion };
  }> {
    const slateFixtures = new SlateFixtures(this.db);
    const slate = await slateFixtures.complete({
      slateIdentifier: data?.slateIdentifier,
      slateStatus: data?.slateStatus ?? SlateStatus.active
    });

    const notification = await this.default({
      slateOid: slate.oid,
      slateId: slate.id,
      slateVersionOid: slate.currentVersion.oid,
      slateVersionId: slate.currentVersion.id,
      type: data?.type,
      overrides: data?.notificationOverrides
    });

    return { notification, slate };
  }
}
