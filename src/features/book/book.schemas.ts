import * as v from 'valibot';
import {
  COPIES_RANGE,
  DEFAULT_PAGE_SIZE,
  FIELD_MAX_LENGTH,
  PUBLICATION_YEAR_RANGE,
} from '../../config/constants.js';
import { BOOK_GENRES } from '../../data/book/book.types.js';

const ISBN_PATTERN = /^97[89]\d{10}$/;

const coercedInt = (fallback: number) =>
  v.optional(
    v.pipe(
      v.union([v.string(), v.number()]),
      v.transform(Number),
      v.number(),
      v.integer(),
      v.minValue(1),
    ),
    fallback,
  );

export const bookListQuerySchema = v.object({
  page: coercedInt(1),
  pageSize: coercedInt(DEFAULT_PAGE_SIZE),
  search: v.optional(v.string()),
  sortBy: v.optional(v.string(), 'title'),
  sortOrder: v.optional(v.picklist(['asc', 'desc'] as const), 'asc'),
});

export const bookIdParamsSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
});

export const createBookBodySchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(FIELD_MAX_LENGTH.md)),
  authorName: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(FIELD_MAX_LENGTH.md)),
  isbn: v.pipe(
    v.string(),
    v.trim(),
    v.regex(ISBN_PATTERN, 'isbn must be 13 digits starting with 978 or 979'),
  ),
  genre: v.picklist(BOOK_GENRES),
  publishedYear: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(PUBLICATION_YEAR_RANGE.min),
    v.maxValue(PUBLICATION_YEAR_RANGE.max),
  ),
  copiesTotal: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(COPIES_RANGE.min),
    v.maxValue(COPIES_RANGE.max),
  ),
  copiesAvailable: v.optional(
    v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(COPIES_RANGE.max)),
  ),
});

export type BookListQuery = v.InferOutput<typeof bookListQuerySchema>;
export type BookIdParams = v.InferOutput<typeof bookIdParamsSchema>;
export type CreateBookBody = v.InferOutput<typeof createBookBodySchema>;
