import './instrument';

import { slatesRegistryApi } from './apis/internal';
import { registryApp } from './apis/public';

Bun.serve({
  fetch: registryApp.fetch,
  port: 52040
});

Bun.serve({
  fetch: slatesRegistryApi,
  port: 52041
});

await import('./worker');

console.log('Slates registry server is running');
