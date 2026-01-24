import { mergeConfig, type ViteUserConfig } from 'vitest/config';

export const isCi = (): boolean =>
  process.env.CI === 'true' ||
  process.env.GITHUB_ACTIONS === 'true' ||
  process.env.GITLAB_CI === 'true';

export const applyCiDefaults = (
  config: ViteUserConfig,
  options: {
    retry?: number;
    testTimeout?: number;
    hookTimeout?: number;
    allowOnly?: boolean;
  } = {}
): ViteUserConfig => {
  if (!isCi()) {
    return config;
  }

  const { retry = 1, testTimeout, hookTimeout, allowOnly = false } = options;
  const overrides: ViteUserConfig = { test: {} };

  overrides.test!.allowOnly = allowOnly;

  if (retry !== undefined) {
    overrides.test!.retry = retry;
  }

  if (testTimeout !== undefined) {
    overrides.test!.testTimeout = testTimeout;
  }

  if (hookTimeout !== undefined) {
    overrides.test!.hookTimeout = hookTimeout;
  }

  return mergeConfig(config, overrides);
};
