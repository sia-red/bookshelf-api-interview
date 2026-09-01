import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { ERROR_CODES } from '../src/core/errors/error-codes.js';
import {
  apiCall,
  postJson,
  setupApp,
  startTestServer,
  VISIBLE_BOOKS,
  type TestServer,
} from './helpers/test-app.js';

const BOOKS = '/api/v1/book';

const NEW_BOOK = {
  title: 'The Ropemaker Variations',
  authorName: 'Ines Karadzic',
  isbn: '9791234567890',
  genre: 'fiction',
  publishedYear: 2024,
  copiesTotal: 4,
};

interface ListBody {
  success: boolean;
  data: { id: string; title: string }[];
  meta: { total: number; page: number; pageSize: number };
}

interface ErrorBody {
  success: boolean;
  error: { code: string; message: string };
}

describe('contract: /api/v1/book', () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(() => {
    setupApp();
  });

  it('GET / answers with the list envelope and pagination meta', async () => {
    const { status, body } = await apiCall(server, `${BOOKS}?pageSize=3`);
    const list = body as ListBody;

    assert.equal(status, 200);
    assert.equal(list.success, true);
    assert.equal(list.data.length, 3);
    assert.deepEqual(list.meta, { total: VISIBLE_BOOKS, page: 1, pageSize: 3 });
  });

  it('GET /:id answers with the detail shape', async () => {
    const { status, body } = await apiCall(server, `${BOOKS}/book-001`);
    const detail = body as { success: boolean; data: Record<string, unknown> };

    assert.equal(status, 200);
    assert.equal(detail.success, true);
    assert.equal(detail.data['id'], 'book-001');
    assert.equal(detail.data['available'], true);
  });

  it('GET /:id answers 404 with the catalogue code when the book does not exist', async () => {
    const { status, body } = await apiCall(server, `${BOOKS}/missing-id`);

    assert.equal(status, 404);
    assert.equal((body as ErrorBody).success, false);
    assert.equal((body as ErrorBody).error.code, ERROR_CODES.BOOK_NOT_FOUND);
  });

  it('POST / creates the book and answers 201', async () => {
    const { status, body } = await apiCall(server, BOOKS, postJson(NEW_BOOK));
    const created = body as { success: boolean; data: Record<string, unknown> };

    assert.equal(status, 201);
    assert.equal(created.success, true);
    assert.equal(created.data['title'], NEW_BOOK.title);
    assert.equal(created.data['copiesAvailable'], NEW_BOOK.copiesTotal);
    assert.ok(typeof created.data['id'] === 'string');
  });

  it('POST / answers 409 when the ISBN is already in the catalogue', async () => {
    const { status, body } = await apiCall(
      server,
      BOOKS,
      postJson({ ...NEW_BOOK, isbn: '9784100000000' }),
    );

    assert.equal(status, 409);
    assert.equal((body as ErrorBody).error.code, ERROR_CODES.BOOK_ISBN_TAKEN);
  });

  it('POST / answers 400 with per-field detail when the body is invalid', async () => {
    const { status, body } = await apiCall(
      server,
      BOOKS,
      postJson({ ...NEW_BOOK, isbn: '123', genre: 'graphic-novel', publishedYear: 1200 }),
    );
    const error = body as { error: { code: string; details: { path: string }[] } };

    assert.equal(status, 400);
    assert.equal(error.error.code, ERROR_CODES.VALIDATION_ERROR);
    assert.deepEqual(error.error.details.map((issue) => issue.path).sort(), [
      'genre',
      'isbn',
      'publishedYear',
    ]);
  });
});

describe('contract: framework-level failures', () => {
  let server: TestServer;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
  });

  beforeEach(() => {
    setupApp();
  });

  it('answers 404 with the error envelope on an unknown route', async () => {
    const { status, body } = await apiCall(server, '/api/v1/nowhere');

    assert.equal(status, 404);
    assert.equal((body as ErrorBody).error.code, ERROR_CODES.ROUTE_NOT_FOUND);
  });

  it('answers 400, not 500, when the JSON body cannot be parsed', async () => {
    const { status, body } = await apiCall(server, BOOKS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"title": "This body is missing its closing brace"',
    });

    assert.equal(status, 400);
    assert.equal((body as ErrorBody).error.code, ERROR_CODES.BAD_REQUEST);
  });

  it('keeps /health outside the versioned prefix', async () => {
    const { status, body } = await apiCall(server, '/health');

    assert.equal(status, 200);
    assert.deepEqual(body, { status: 'ok' });
  });
});
