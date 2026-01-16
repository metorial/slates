import type { PrismaClient } from '../../../prisma/generated/client';
import { RegistryFixtures } from './registryFixtures';
import { SlateFixtures } from './slateFixtures';
import { SlateVersionFixtures } from './slateVersionFixtures';
import { SlateSpecificationFixtures } from './slateSpecificationFixtures';

export function fixtures(db: PrismaClient) {
  return {
    registry: new RegistryFixtures(db),
    slate: new SlateFixtures(db),
    slateVersion: new SlateVersionFixtures(db),
    slateSpecification: new SlateSpecificationFixtures(db),
  };
}

export {
  RegistryFixtures,
  SlateFixtures,
  SlateVersionFixtures,
  SlateSpecificationFixtures,
};
