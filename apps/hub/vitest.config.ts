import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'test', process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@slates/proto': resolve(__dirname, '../../packages/proto/src/index.ts'),
        '@slates/provider': resolve(__dirname, '../../packages/provider/src/index.ts')
      }
    },
    test: {
      globals: true,
      pool: 'forks',
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
      env: {
        ...env,
        NODE_ENV: 'test'
      }
    },
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
  };
});
