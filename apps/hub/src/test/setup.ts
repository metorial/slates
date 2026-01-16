import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '../../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

const testDbUrl = process.env.DATABASE_URL ?? '';

// Validate we're using the test database, safe guard against using the wrong database
if (!testDbUrl.includes('slates-hub-test')) {
  throw new Error(
    `Tests must use slates-hub-test database. ` +
    `Current DATABASE_URL: ${testDbUrl}. ` +
    `Ensure .env.test is present and Vitest is loading it correctly.`
  );
}

const adapter = new PrismaPg({ connectionString: testDbUrl });
export const testDb = new PrismaClient({ adapter });

beforeAll(async () => {
  await testDb.$connect();
  await cleanDatabase();
});

export async function cleanDatabase() {
  const tables = await testDb.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`
  );

  if (tables.length === 0) {
    return;
  }

  const tableNames = tables
    .map(t => `"${t.tablename}"`)
    .join(', ');

  await testDb.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
}

afterAll(async () => {
  await testDb.$disconnect();
});
