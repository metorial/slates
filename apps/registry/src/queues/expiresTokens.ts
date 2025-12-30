import { createCron } from '@lowerdeck/cron';
import { db } from '../db';
import { env } from '../env';

export let expireTokensProcessor = createCron(
  {
    name: 'sreg/expireTokens',
    cron: '* * * * *',
    redisUrl: env.service.REDIS_URL
  },
  async () => {
    await db.token.updateMany({
      where: {
        status: 'active',
        expiresAt: {
          lte: new Date()
        }
      },
      data: {
        status: 'expired'
      }
    });
  }
);
