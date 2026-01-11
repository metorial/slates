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

let adminDir = './dist/admin';

Bun.serve({
  fetch: async (req, server) => {
    let url = new URL(req.url);

    // API
    if (url.pathname.startsWith('/slates-registry-admin')) {
      return slatesRegistryAdminApi(req, server);
    }

    if (url.pathname === '/') {
      return Response.redirect(new URL('/admin', req.url), 302);
    }

    // Admin dashboard
    if (url.pathname.startsWith('/admin')) {
      let path = url.pathname.replace(/^\/admin/, '') || '/index.html';
      if (path === '/') path = '/index.html';

      let file = Bun.file(`${adminDir}${path}`);
      if (await file.exists()) return new Response(file);

      if (!path.includes('.')) {
        let index = Bun.file(`${adminDir}/index.html`);
        if (await index.exists()) return new Response(index);
      }
    }

    return new Response('Not Found', { status: 404 });
  },
  port: 52042
});

await import('./worker');

console.log('Slates registry server is running');
