import type { PrismaClient } from '../../../prisma/generated/client';

export abstract class BaseFixture {
  constructor(protected db: PrismaClient) {}
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
