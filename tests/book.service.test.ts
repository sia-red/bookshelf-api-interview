import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { AppError } from '../src/core/errors/app-error.js';
import { ERROR_CODES } from '../src/core/errors/error-codes.js';
import type { BookService } from '../src/features/book/book.service.js';
import type { CreateBookBody } from '../src/features/book/book.schemas.js';
import { setupApp, testContext } from './helpers/test-app.js';

const NEW_BOOK: CreateBookBody = {
  title: 'The Ropemaker Variations',
  authorName: 'Ines Karadzic',
  isbn: '9791234567890',
  genre: 'fiction',
  publishedYear: 2024,
  copiesTotal: 4,
};

/** An ISBN the shipped fixture already uses. */
const TAKEN_ISBN = '9784100000000';

describe('BookService.create', () => {
  let service: BookService;

  beforeEach(() => {
    service = setupApp().container.bookService;
  });

  it('puts every copy on the shelf when copiesAvailable is omitted', async () => {
    const created = await service.create(testContext(), NEW_BOOK);

    assert.equal(created.copiesTotal, 4);
    assert.equal(created.copiesAvailable, 4);
    assert.equal(created.available, true);
  });

  it('honours an explicit copiesAvailable', async () => {
    const created = await service.create(testContext(), { ...NEW_BOOK, copiesAvailable: 1 });

    assert.equal(created.copiesAvailable, 1);
  });

  it('rejects an ISBN already in the catalogue with 409', async () => {
    await assert.rejects(
      () => service.create(testContext(), { ...NEW_BOOK, isbn: TAKEN_ISBN }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 409);
        assert.equal(error.code, ERROR_CODES.BOOK_ISBN_TAKEN);
        return true;
      },
    );
  });

  it('rejects more copies available than the library owns with 400', async () => {
    await assert.rejects(
      () => service.create(testContext(), { ...NEW_BOOK, copiesTotal: 2, copiesAvailable: 9 }),
      (error: unknown) => {
        assert.ok(error instanceof AppError);
        assert.equal(error.statusCode, 400);
        assert.equal(error.code, ERROR_CODES.BOOK_COPIES_INVALID);
        return true;
      },
    );
  });

  it('does not create the book when a rule rejects it', async () => {
    const { container } = setupApp();
    await assert.rejects(() =>
      container.bookService.create(testContext(), { ...NEW_BOOK, isbn: TAKEN_ISBN }),
    );

    const found = await container.bookRepo.getList(testContext(), {
      page: 1,
      pageSize: 50,
      search: NEW_BOOK.title,
    });
    assert.equal(found.meta.total, 0);
  });
});
