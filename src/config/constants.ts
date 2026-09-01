export const API_PREFIX = '/api/v1';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const MAX_JSON_BODY_BYTES = 100 * 1024;

export const FIELD_MAX_LENGTH = {
  sm: 30,
  md: 125,
  lg: 300,
} as const;

export const PUBLICATION_YEAR_RANGE = {
  min: 1450,
  max: 2100,
} as const;

export const COPIES_RANGE = {
  min: 1,
  max: 1000,
} as const;

/** How long a book stays out on loan before it is due back. */
export const LOAN_PERIOD_DAYS = 14;
