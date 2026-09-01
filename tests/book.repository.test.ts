import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { BookRepository } from '../src/data/book/book.repository.js';
import { FIRST_TITLE_ASC, setupApp, testContext, VISIBLE_BOOKS } from './helpers/test-app.js';

const PAGE_SIZE = 5;

describe('BookRepository.getList', () => {
  let repo: BookRepository;

  beforeEach(() => {
    repo = setupApp().container.bookRepo;
  });

  it('starts page 1 at the first record', async () => {
    const { data, meta } = await repo.getList(testContext(), {
      page: 1,
      pageSize: PAGE_SIZE,
      sortBy: 'title',
      sortOrder: 'asc',
    });

    assert.equal(data.length, PAGE_SIZE);
    assert.equal(data[0]?.title, FIRST_TITLE_ASC);
    assert.deepEqual(meta, { total: VISIBLE_BOOKS, page: 1, pageSize: PAGE_SIZE });
  });

  it('continues page 2 where page 1 stopped, with no gap and no overlap', async () => {
    const params = { pageSize: PAGE_SIZE, sortBy: 'title', sortOrder: 'asc' } as const;
    const first = await repo.getList(testContext(), { ...params, page: 1 });
    const second = await repo.getList(testContext(), { ...params, page: 2 });

    const all = await repo.getList(testContext(), { ...params, page: 1, pageSize: PAGE_SIZE * 2 });

    assert.deepEqual(
      [...first.data, ...second.data].map((book) => book.id),
      all.data.map((book) => book.id),
    );
  });

  it('reports a total that ignores pagination and excludes soft-deleted records', async () => {
    const { data, meta } = await repo.getList(testContext(), { page: 1, pageSize: 3 });

    assert.equal(data.length, 3);
    assert.equal(meta.total, VISIBLE_BOOKS);
  });

  it('never returns a soft-deleted record', async () => {
    const { data, meta } = await repo.getList(testContext(), {
      page: 1,
      pageSize: 50,
      search: 'Withdrawn Catalogue Sampler',
    });

    assert.equal(meta.total, 0);
    assert.deepEqual(data, []);
  });

  it('searches the title case-insensitively', async () => {
    const { data, meta } = await repo.getList(testContext(), {
      page: 1,
      pageSize: 50,
      search: 'HARBOUR',
    });

    assert.equal(meta.total, 3);
    assert.ok(data.every((book) => book.title.toLowerCase().includes('harbour')));
  });

  it('treats a search term with regex characters literally', async () => {
    const { meta } = await repo.getList(testContext(), {
      page: 1,
      pageSize: 50,
      search: 'A.Cartography',
    });

    assert.equal(meta.total, 0);
  });

  it('sorts descending when asked', async () => {
    const { data } = await repo.getList(testContext(), {
      page: 1,
      pageSize: 50,
      sortBy: 'publishedYear',
      sortOrder: 'desc',
    });

    const years = data.map((book) => book.publishedYear);
    assert.deepEqual(
      years,
      [...years].sort((a, b) => b - a),
    );
  });
});

describe('BookRepository.getDetail', () => {
  let repo: BookRepository;

  beforeEach(() => {
    repo = setupApp().container.bookRepo;
  });

  it('returns undefined for an unknown id', async () => {
    assert.equal(await repo.getDetail(testContext(), 'does-not-exist'), undefined);
  });

  it('returns undefined for a soft-deleted record', async () => {
    assert.equal(await repo.getDetail(testContext(), 'book-042'), undefined);
  });

  it('marks a book with no copies on the shelf as unavailable', async () => {
    const detail = await repo.getDetail(testContext(), 'book-002');

    assert.equal(detail?.copiesAvailable, 0);
    assert.equal(detail?.available, false);
  });
});
