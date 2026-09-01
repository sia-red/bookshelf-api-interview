import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { BookMapper } from '../src/data/book/book.mapper.js';
import { BOOK_STATUS } from '../src/data/book/book.types.js';
import { bookRecord, setupApp } from './helpers/test-app.js';

const LIST_ITEM_KEYS = [
  'authorName',
  'copiesAvailable',
  'genre',
  'id',
  'publishedYear',
  'status',
  'title',
];

describe('BookMapper', () => {
  let mapper: BookMapper;

  beforeEach(() => {
    setupApp();
    mapper = new BookMapper();
  });

  it('projects a list item down to the columns a table shows', async () => {
    const item = mapper.toListItem(mapper.toModel(await bookRecord('book-001')));

    assert.deepEqual(Object.keys(item).sort(), LIST_ITEM_KEYS);
  });

  it('derives availability from status and copies on the shelf', async () => {
    const onShelf = mapper.toModel(await bookRecord('book-001'));
    const noCopies = mapper.toModel(await bookRecord('book-002'));
    const retired = mapper.toModel(await bookRecord('book-020'));

    assert.equal(mapper.toDetail(onShelf).available, true);
    assert.equal(mapper.toDetail(noCopies).available, false);
    assert.equal(retired.status, BOOK_STATUS.retired);
    assert.equal(mapper.toDetail(retired).available, false);
  });
});
