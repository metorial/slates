import { apiMux } from '@lowerdeck/api-mux';
import { slatesHubAdminApi } from './controllers';

let adminDir = './dist/admin';

let frontendHandler = async (req: Request) => {
  let url = new URL(req.url);
  let path = url.pathname || '/admin/index.html';
  if (path === '/admin' || path === '/admin/') path = '/admin/index.html';

  let filePath = path.replace(/^\/admin/, '');
  if (!filePath || filePath === '/') filePath = '/index.html';

  let file = Bun.file(`${adminDir}${filePath}`);
  if (await file.exists()) return new Response(file);

  if (!filePath.includes('.')) {
    let index = Bun.file(`${adminDir}/index.html`);
    if (await index.exists()) return new Response(index);
  }

  return new Response('Not Found', { status: 404 });
};

export let adminApi = apiMux([{ endpoint: slatesHubAdminApi }], frontendHandler);
