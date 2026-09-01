import { randomUUID } from 'node:crypto';
import { RecordNotFoundError, type RawQuery, type RawRecord, type Store } from './store.js';

type Row = Record<string, unknown>;
type Constraint = (row: Row) => boolean;

const TIMESTAMP_FIELDS = ['createdAt', 'updatedAt'] as const;

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  return undefined;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'en', { sensitivity: 'base' });
}

class MemoryRecord implements RawRecord {
  readonly className: string;
  private readonly snapshot: Row;
  private readonly pending = new Map<string, unknown>();
  private readonly removed = new Set<string>();

  constructor(className: string, snapshot: Row) {
    this.className = className;
    this.snapshot = snapshot;
  }

  get id(): string | undefined {
    const value = this.snapshot['id'];
    return typeof value === 'string' ? value : undefined;
  }

  get createdAt(): Date | undefined {
    return toDate(this.snapshot['createdAt']);
  }

  get updatedAt(): Date | undefined {
    return toDate(this.snapshot['updatedAt']);
  }

  get(field: string): unknown {
    if (this.removed.has(field)) return undefined;
    if (this.pending.has(field)) return this.pending.get(field);
    return this.snapshot[field];
  }

  set(field: string, value: unknown): void {
    this.removed.delete(field);
    this.pending.set(field, value);
  }

  unset(field: string): void {
    this.pending.delete(field);
    this.removed.add(field);
  }

  dirtyKeys(): string[] {
    return [...this.pending.keys(), ...this.removed];
  }

  attributes(): Row {
    const merged: Row = { ...this.snapshot };
    for (const [key, value] of this.pending) merged[key] = value;
    for (const key of this.removed) delete merged[key];
    delete merged['id'];
    delete merged['createdAt'];
    delete merged['updatedAt'];
    return merged;
  }

  /** The row as it should be persisted. Used by the store, not by consumers. */
  toRow(): Row {
    const merged: Row = { ...this.snapshot };
    for (const [key, value] of this.pending) merged[key] = value;
    for (const key of this.removed) delete merged[key];
    return merged;
  }
}

class MemoryQuery implements RawQuery {
  private readonly constraints: Constraint[] = [];
  private sortField: string | undefined;
  private sortDirection: 'asc' | 'desc' = 'asc';
  private skipCount = 0;
  private limitCount: number | undefined;

  constructor(
    readonly className: string,
    private readonly rows: () => Row[],
  ) {}

  equalTo(field: string, value: unknown): this {
    this.constraints.push((row) => row[field] === value);
    return this;
  }

  notEqualTo(field: string, value: unknown): this {
    this.constraints.push((row) => row[field] !== value);
    return this;
  }

  greaterThan(field: string, value: unknown): this {
    this.constraints.push((row) => compareValues(row[field], value) > 0);
    return this;
  }

  lessThan(field: string, value: unknown): this {
    this.constraints.push((row) => compareValues(row[field], value) < 0);
    return this;
  }

  matches(field: string, pattern: RegExp): this {
    this.constraints.push((row) => {
      const value = row[field];
      return typeof value === 'string' && pattern.test(value);
    });
    return this;
  }

  ascending(field: string): this {
    this.sortField = field;
    this.sortDirection = 'asc';
    return this;
  }

  descending(field: string): this {
    this.sortField = field;
    this.sortDirection = 'desc';
    return this;
  }

  skip(count: number): this {
    this.skipCount = count;
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  /** Rows matching every constraint, sorted — before pagination. */
  private matching(): Row[] {
    const matched = this.rows().filter((row) =>
      this.constraints.every((constraint) => constraint(row)),
    );

    const field = this.sortField;
    if (!field) return matched;

    const direction = this.sortDirection === 'desc' ? -1 : 1;
    return matched.sort((a, b) => compareValues(a[field], b[field]) * direction);
  }

  async find(): Promise<RawRecord[]> {
    const matched = this.matching();
    const end = this.limitCount === undefined ? undefined : this.skipCount + this.limitCount;
    return matched
      .slice(this.skipCount, end)
      .map((row) => new MemoryRecord(this.className, { ...row }));
  }

  async first(): Promise<RawRecord | undefined> {
    const [row] = this.matching();
    return row ? new MemoryRecord(this.className, { ...row }) : undefined;
  }

  async count(): Promise<number> {
    return this.matching().length;
  }

  /** Applies this query's constraints to a single row. Used by `Store.getRecord`. */
  accepts(row: Row): boolean {
    return this.constraints.every((constraint) => constraint(row));
  }
}

export class MemoryStore implements Store {
  private readonly tables = new Map<string, Map<string, Row>>();

  private table(className: string): Map<string, Row> {
    const existing = this.tables.get(className);
    if (existing) return existing;
    const created = new Map<string, Row>();
    this.tables.set(className, created);
    return created;
  }

  create(className: string): RawRecord {
    return new MemoryRecord(className, {});
  }

  query(className: string): RawQuery {
    return new MemoryQuery(className, () => [...this.table(className).values()]);
  }

  async getRecord(query: RawQuery, id: string): Promise<RawRecord> {
    if (!(query instanceof MemoryQuery)) {
      throw new TypeError('getRecord received a query built by a different store');
    }
    const row = this.table(query.className).get(id);
    if (!row || !query.accepts(row)) {
      throw new RecordNotFoundError(query.className, id);
    }
    return new MemoryRecord(query.className, { ...row });
  }

  async saveRecord(record: RawRecord): Promise<RawRecord> {
    if (!(record instanceof MemoryRecord)) {
      throw new TypeError('saveRecord received a record built by a different store');
    }

    const table = this.table(record.className);
    const now = new Date();
    const row = record.toRow();
    const id = typeof row['id'] === 'string' ? row['id'] : randomUUID();

    const stored: Row = {
      ...row,
      id,
      createdAt: toDate(row['createdAt']) ?? now,
      updatedAt: now,
    };

    table.set(id, stored);
    return new MemoryRecord(record.className, { ...stored });
  }

  seed(className: string, rows: Row[]): void {
    const table = this.table(className);
    for (const row of rows) {
      const id = typeof row['id'] === 'string' ? row['id'] : randomUUID();
      const stored: Row = { ...row, id };
      for (const field of TIMESTAMP_FIELDS) {
        stored[field] = toDate(row[field]) ?? new Date();
      }
      table.set(id, stored);
    }
  }

  reset(): void {
    this.tables.clear();
  }
}
