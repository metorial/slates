import { createSlatesHubInternalClient } from '../../../../clients/hub/src/index.ts';
import { slatesHubApi } from '../apis/internal';

type ClientOptsLike = {
  endpoint: string;
  headers?: Record<string, string | undefined>;
  getHeaders?: () => Promise<Record<string, string>> | Record<string, string>;
  onRequest?: (d: {
    endpoint: string;
    name: string;
    payload: any;
    headers: Record<string, string | undefined>;
    query?: Record<string, string | undefined>;
  }) => any;
};

type InMemoryRoute = {
  origin: string;
  pathPrefix: string;
};

const inMemoryRoutes: InMemoryRoute[] = [];
let originalFetch: typeof fetch | null = null;
let fetchInstalled = false;

const registerInMemoryRoute = (endpoint: string) => {
  const url = new URL(endpoint);
  const pathPrefix = url.pathname.replace(/\/+$/, '') || '/';

  const exists = inMemoryRoutes.some(
    route => route.origin === url.origin && route.pathPrefix === pathPrefix
  );
  if (!exists) {
    inMemoryRoutes.push({ origin: url.origin, pathPrefix });
  }
};

const shouldHandleInMemory = (url: URL) =>
  inMemoryRoutes.some(
    route => url.origin === route.origin && url.pathname.startsWith(route.pathPrefix)
  );

type FetchLike = (input: Request | string | URL, init?: RequestInit) => Promise<Response>;

const inMemoryFetch: FetchLike = async (input, init) => {
  const request =
    typeof input === 'string' || input instanceof URL
      ? new Request(input.toString(), init)
      : new Request(input, init);
  const url = new URL(request.url);

  if (shouldHandleInMemory(url)) {
    return slatesHubApi(request, undefined);
  }

  if (!originalFetch) {
    throw new Error('Original fetch is not available');
  }

  return originalFetch(request);
};

const ensureFetchInstalled = () => {
  if (fetchInstalled) return;
  if (!globalThis.fetch) {
    throw new Error('global fetch is not available');
  }

  originalFetch = globalThis.fetch.bind(globalThis);
  const fetchWithProps = inMemoryFetch as typeof fetch;
  if ('preconnect' in originalFetch) {
    (fetchWithProps as any).preconnect = (originalFetch as any).preconnect;
  }

  globalThis.fetch = fetchWithProps;
  fetchInstalled = true;
};

const defaultEndpoint = 'http://slates-hub.test/slates-hub';

export const createTestHubClient = (opts: Partial<ClientOptsLike> = {}) => {
  const endpoint = opts.endpoint ?? defaultEndpoint;
  registerInMemoryRoute(endpoint);
  ensureFetchInstalled();

  return createSlatesHubInternalClient({
    ...opts,
    endpoint
  } as ClientOptsLike);
};

export const slatesHubClient = createTestHubClient();
export type SlatesHubTestClient = ReturnType<typeof createTestHubClient>;
