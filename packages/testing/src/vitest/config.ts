import { mergeConfig, type ViteUserConfig } from 'vitest/config';

const baseVitestConfig: ViteUserConfig = {
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    sequence: {
      concurrent: false
    },
    fileParallelism: false,
    maxConcurrency: 1,
    allowOnly: process.env.CI !== 'true'
  }
};

export const createVitestConfig = (overrides: ViteUserConfig = {}): ViteUserConfig =>
  mergeConfig(baseVitestConfig, overrides);

export const withAliases = (config: ViteUserConfig, aliases: Record<string, string>): ViteUserConfig =>
  mergeConfig(config, { resolve: { alias: aliases } });
