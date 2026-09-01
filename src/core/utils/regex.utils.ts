const REGEXP_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/** Escapes a user-supplied search term so it matches literally instead of as a pattern. */
export function escapeRegExp(value: string): string {
  return value.replace(REGEXP_SPECIAL_CHARS, '\\$&');
}
