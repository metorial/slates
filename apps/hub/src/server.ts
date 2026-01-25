import './instrument';

import { slatesHubApi } from './apis/internal';
import { hubApp } from './apis/public';

Bun.serve({
  fetch: hubApp.fetch,
  port: 52045
});

Bun.serve({
  fetch: slatesHubApi,
  port: 52046
});

await import('./worker');

console.log('Slates hub server is running');
