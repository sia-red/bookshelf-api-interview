import type { RequestContext } from '../../core/http/request-context.js';
import type { PaginatedMeta } from '../../core/http/response.types.js';
import { BaseRepository } from '../base/base.repository.js';
import type { ListParams } from '../base/base.types.js';
import { BookMapper } from './book.mapper.js';
import {
  BOOK_STATUS,
  type Book,
  type BookDetail,
  type BookListItem,
  type CreateBookData,
} from './book.types.js';

export class BookRepository extends BaseRepository<Book> {
  protected override readonly className = 'Book';
  protected override readonly mapper = new BookMapper();
  protected override readonly searchField = 'title';

  async getListItems(
    ctx: RequestContext,
    params: ListParams,
  ): Promise<{ data: BookListItem[]; meta: PaginatedMeta }> {
    const { data, meta } = await this.getList(ctx, params);
    return { data: this.mapper.toListItemArray(data), meta };
  }

  async getDetail(ctx: RequestContext, id: string): Promise<BookDetail | undefined> {
    const book = await this.getById(ctx, id);
    return book ? this.mapper.toDetail(book) : undefined;
  }

  async findByIsbn(ctx: RequestContext, isbn: string): Promise<Book | undefined> {
    const query = this.createQuery();
    query.equalTo('isbn', isbn);
    const found = await query.first();
    this.logger.debug(`Lookup by ISBN ${isbn}: ${found ? 'hit' : 'miss'}`, {
      requestId: ctx.requestId,
    });
    return found ? this.mapper.toModel(found) : undefined;
  }

  async createBook(ctx: RequestContext, data: CreateBookData): Promise<BookDetail> {
    const created = await this.create(ctx, { ...data, status: BOOK_STATUS.active });
    return this.mapper.toDetail(created);
  }
}
