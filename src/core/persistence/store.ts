/**
 * Engine-agnostic record and query types.
 *
 * Nothing outside `core/persistence/` names a concrete engine: the rest of the codebase only ever
 * talks to these interfaces, obtained through `getStore()`. Swapping the in-memory adapter for a
 * real database means writing a new implementation of `Store` and pointing the factory at it.
 */

export interface RawRecord {
  readonly className: string;
  readonly id: string | undefined;
  readonly createdAt: Date | undefined;
  readonly updatedAt: Date | undefined;
  get(field: string): unknown;
  set(field: string, value: unknown): void;
  unset(field: string): void;
  dirtyKeys(): string[];
  attributes(): Record<string, unknown>;
}

export interface RawQuery {
  equalTo(field: string, value: unknown): this;
  notEqualTo(field: string, value: unknown): this;
  greaterThan(field: string, value: unknown): this;
  lessThan(field: string, value: unknown): this;
  matches(field: string, pattern: RegExp): this;
  ascending(field: string): this;
  descending(field: string): this;
  skip(count: number): this;
  limit(count: number): this;
  find(): Promise<RawRecord[]>;
  first(): Promise<RawRecord | undefined>;
  count(): Promise<number>;
}

export interface Store {
  create(className: string): RawRecord;
  query(className: string): RawQuery;
  getRecord(query: RawQuery, id: string): Promise<RawRecord>;
  saveRecord(record: RawRecord): Promise<RawRecord>;
  seed(className: string, rows: Record<string, unknown>[]): void;
  reset(): void;
}

export class RecordNotFoundError extends Error {
  readonly className: string;
  readonly recordId: string;

  constructor(className: string, recordId: string) {
    super(`${className} ${recordId} not found`);
    this.name = 'RecordNotFoundError';
    this.className = className;
    this.recordId = recordId;
  }
}
