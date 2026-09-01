import type { BaseModel } from '../base/base.types.js';

export const BOOK_STATUS = {
  active: 'active',
  retired: 'retired',
} as const;

export type BookStatus = (typeof BOOK_STATUS)[keyof typeof BOOK_STATUS];

export const BOOK_STATUSES = [BOOK_STATUS.active, BOOK_STATUS.retired] as const;

export const BOOK_GENRES = [
  'fiction',
  'history',
  'poetry',
  'science',
  'biography',
  'essay',
  'reference',
  'children',
] as const;

export type BookGenre = (typeof BOOK_GENRES)[number];

/**
 * The book as the rest of the application knows it.
 *
 * A stored record carries more columns than this — `acquisitionCost` is what the library paid for the
 * copy, and it is nobody's business outside the acquisitions team. Fields absent from this interface
 * are absent on purpose; the mapper is what keeps them out.
 */
export interface Book extends BaseModel {
  title: string;
  authorName: string;
  isbn: string;
  genre: BookGenre;
  publishedYear: number;
  copiesTotal: number;
  copiesAvailable: number;
  status: BookStatus;
}

/** The columns a catalogue table shows. */
export interface BookListItem {
  id: string;
  title: string;
  authorName: string;
  genre: BookGenre;
  publishedYear: number;
  copiesAvailable: number;
  status: BookStatus;
}

export interface BookDetail extends Book {
  available: boolean;
}

export interface CreateBookData {
  title: string;
  authorName: string;
  isbn: string;
  genre: BookGenre;
  publishedYear: number;
  copiesTotal: number;
  copiesAvailable: number;
}
