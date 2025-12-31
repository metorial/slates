import { notFoundError, ServiceError } from '@lowerdeck/error';
import { Paginator } from '@lowerdeck/pagination';
import { Service } from '@lowerdeck/service';
import type { Tenant } from '../../prisma/generated/client';
import { db } from '../db';

class changeNotificationServiceImpl {
  async getChangeNotificationById(d: { id: string; tenant?: Tenant }) {
    let func = await db.changeNotification.findFirst({
      where: {
        id: d.id,
        tenantOid: d.tenant?.oid
      }
    });
    if (!func) throw new ServiceError(notFoundError('change_notification'));
    return func;
  }

  async listChangeNotifications(d: { tenant?: Tenant }) {
    return Paginator.create(({ prisma }) =>
      prisma(
        async opts =>
          await db.changeNotification.findMany({
            ...opts,
            where: {
              tenantOid: d.tenant?.oid
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
