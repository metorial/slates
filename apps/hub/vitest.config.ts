import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode || 'test', process.cwd(), '');

  return {
    resolve: {
      alias: {
        '@slates/proto': resolve(__dirname, '../../packages/proto/src/index.ts'),
        '@slates/provider': resolve(__dirname, '../../packages/provider/src/index.ts'),
        '@metorial-services/slates-registry-client': resolve(
          __dirname,
          '../../clients/registry/src/index.ts'
        ),
        '@metorial-services/slates-registry-internal-client': resolve(
          __dirname,
          '../../clients/registry-internal/src/index.ts'
        )
      }
    },
    test: {
      globals: true,
      pool: 'forks',
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],
      testTimeout: 30000,
      hookTimeout: 30000,
      sequence: {
        concurrent: false
      },
      fileParallelism: false,
      maxConcurrency: 1,
      env: {
        ...env,
        NODE_ENV: 'test'
      }
    },
    poolOptions: {
      forks: {
        singleFork: true
      }
    }
  };
});
