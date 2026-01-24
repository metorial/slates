import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../prisma/generated/client';
import { setupTestGlobals, withTestDb } from '@metorial/testing';

setupTestGlobals({ nodeEnv: 'test' });

const { client, clean } = withTestDb<PrismaClient>({
  guard: 'slates-hub-test',
  prismaClientFactory: url => new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
});

export const testDb: PrismaClient = client;
export const cleanDatabase = clean;
