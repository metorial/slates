import { slatesRegistryAdminApi } from './apis/admin';
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

Bun.serve({
  fetch: slatesRegistryAdminApi,
  port: 52042
});

await import('./worker');

console.log('Slates registry server is running');
