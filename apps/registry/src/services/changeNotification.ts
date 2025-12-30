import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Instance } from '../../prisma/generated/client';
import { db } from '../db';

class changeNotificationServiceImpl {
  async getChangeNotificationById(d: { id: string; instance?: Instance }) {
    let func = await db.changeNotification.findFirst({
      where: {
        id: d.id,
        instanceOid: d.instance?.oid
      }
    });
    if (!func) throw new ServiceError(notFoundError('change_notification'));
    return func;
  }

  async listChangeNotifications(d: { instance?: Instance }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.changeNotification.findMany({
            ...opts,
            where: {
              instanceOid: d.instance?.oid
            }
          })
      )
    );
  }
}

export let changeNotificationService = Service.create(
  'changeNotificationService',
  () => new changeNotificationServiceImpl()
).build();
