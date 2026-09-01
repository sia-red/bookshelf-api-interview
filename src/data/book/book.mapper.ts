import type { RawRecord } from '../../core/persistence/store.js';
import { ListMapper } from '../base/list.mapper.js';
import { BOOK_STATUS, type Book, type BookDetail, type BookListItem } from './book.types.js';

export class BookMapper extends ListMapper<Book, BookListItem> {
  toModel(obj: RawRecord): Book {
    return {
      ...this.resolveBaseFields(obj),
      ...(obj.attributes() as Omit<Book, 'id' | 'createdAt' | 'updatedAt'>),
    };
  }

  toListItem(model: Book): BookListItem {
    return {
      id: model.id,
      title: model.title,
      authorName: model.authorName,
      genre: model.genre,
      publishedYear: model.publishedYear,
      copiesAvailable: model.copiesAvailable,
      status: model.status,
    };
  }

  toDetail(model: Book): BookDetail {
    return {
      ...model,
      available: model.status === BOOK_STATUS.active && model.copiesAvailable > 0,
    };
  }
}
