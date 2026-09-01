import * as v from 'valibot';
import { DEFAULT_PAGE_SIZE, FIELD_MAX_LENGTH, MAX_PAGE_SIZE } from '../../config/constants.js';

const SORT_ORDERS = ['asc', 'desc'] as const;

// Query strings arrive as text, so the number is coerced before it is checked. `integer()` also
// rejects the NaN a non-numeric value coerces to.
const pageSchema = v.optional(
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
  ),
  1,
);

const pageSizeSchema = v.optional(
  v.pipe(
    v.union([v.string(), v.number()]),
    v.transform(Number),
    v.number(),
    v.integer(),
    v.minValue(1),
    v.maxValue(MAX_PAGE_SIZE),
  ),
  DEFAULT_PAGE_SIZE,
);

const searchSchema = v.optional(v.pipe(v.string(), v.trim(), v.maxLength(FIELD_MAX_LENGTH.md)));

/**
 * The shared list contract: page, pageSize, search, sortBy, sortOrder.
 *
 * `sortableFields` is required on purpose. `sortBy` reaches the persistence layer as a column name,
 * so the set of accepted values is part of the endpoint's contract and is declared per entity —
 * never taken from the client as free text.
 */
export function listQuerySchema<const TFields extends readonly [string, ...string[]]>(options: {
  sortableFields: TFields;
  defaultSortBy: TFields[number];
}) {
  return v.object({
    page: pageSchema,
    pageSize: pageSizeSchema,
    search: searchSchema,
    sortBy: v.optional(v.picklist(options.sortableFields), options.defaultSortBy),
    sortOrder: v.optional(v.picklist(SORT_ORDERS), 'asc'),
  });
}
