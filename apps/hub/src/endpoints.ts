import { redis } from 'bun';
import { slatesHubApi } from './apis/internal';
import { hubApp } from './apis/public';
import { db } from './db';

Bun.serve({
  fetch: hubApp.fetch,
  port: 52045
});

Bun.serve({
  fetch: slatesHubApi,
  port: 52046
});

console.log('Slates hub server is running');

Bun.serve({
  fetch: async _ => {
    try {
      await db.hub.count();
      await redis.ping();
      return new Response('OK');
    } catch (e) {
      return new Response('Service Unavailable', { status: 503 });
    }
  },
  port: 12121
});
