import { once } from 'node:events';
import { buildApp } from '../../src/app.js';
import { createContainer } from '../../src/bootstrap/container.js';
import { seedFixtures } from '../../src/bootstrap/seed.js';
import type { Container } from '../../src/bootstrap/container.types.js';
import type { RequestContext } from '../../src/core/http/request-context.js';
import { createLogger } from '../../src/core/logger/logger.js';
import { getStore, initializePersistence } from '../../src/core/persistence/store-factory.js';
import type { RawRecord, Store } from '../../src/core/persistence/store.js';

export const TEST_LOGGER = createLogger('silent');

export const BOOK_CLASS = 'Book';

/** Number of books the fixture leaves visible: 42 rows, 2 of them soft-deleted. */
export const VISIBLE_BOOKS = 40;

export const FIRST_TITLE_ASC = 'A Cartography of Small Rooms';

export function testContext(): RequestContext {
  return { requestId: 'test-request', logger: TEST_LOGGER };
}

/** A store loaded with the shipped fixture, plus a freshly wired container. */
export function setupApp(): { store: Store; container: Container } {
  const store = initializePersistence();
  seedFixtures(store);
  return { store, container: createContainer(TEST_LOGGER) };
}

export async function bookRecord(id: string): Promise<RawRecord> {
  return getStore().getRecord(getStore().query(BOOK_CLASS), id);
}

export interface TestServer {
  url: string;
  close(): Promise<void>;
}

export async function startTestServer(): Promise<TestServer> {
  setupApp();
  const server = buildApp(TEST_LOGGER).listen(0);
  await once(server, 'listening');

  const address = server.address();
  const port = typeof address === 'object' && address !== null ? address.port : 0;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export interface ApiCall {
  status: number;
  text: string;
  body: unknown;
}

export async function apiCall(
  server: TestServer,
  path: string,
  init?: RequestInit,
): Promise<ApiCall> {
  const response = await fetch(`${server.url}${path}`, init);
  const text = await response.text();
  let body: unknown = undefined;
  try {
    body = JSON.parse(text);
  } catch {
    body = undefined;
  }
  return { status: response.status, text, body };
}

export function postJson(payload: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}
