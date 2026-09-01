import type { RawRecord } from '../../core/persistence/store.js';
import type { BaseModel } from './base.types.js';

/**
 * Translates a stored record into a domain model, one field at a time.
 *
 * Field by field is the rule, not a style preference: a record may carry columns that are internal
 * to the organisation, and a mapper that copies whatever it finds turns every one of them into part
 * of the public API. The `resolve*` helpers exist so an explicit mapping stays short to write.
 */
export abstract class BaseMapper<TModel extends BaseModel> {
  abstract toModel(obj: RawRecord): TModel;

  toModelArray(objects: RawRecord[]): TModel[] {
    return objects.map((obj) => this.toModel(obj));
  }

  protected resolveBaseFields(obj: RawRecord): BaseModel {
    if (!obj.id) {
      throw new Error(`[Mapper] record missing id (class: ${obj.className})`);
    }
    return {
      id: obj.id,
      createdAt: obj.createdAt?.toISOString() ?? '',
      updatedAt: obj.updatedAt?.toISOString() ?? '',
    };
  }

  protected resolveString(obj: RawRecord, field: string, fallback = ''): string {
    const value = obj.get(field);
    return typeof value === 'string' ? value : fallback;
  }

  protected resolveNumber(obj: RawRecord, field: string, fallback = 0): number {
    const value = obj.get(field);
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  /** The number, or `undefined` when the field is absent — the distinction `resolveNumber` cannot make. */
  protected resolveOptionalNumber(obj: RawRecord, field: string): number | undefined {
    const value = obj.get(field);
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  protected resolveBoolean(obj: RawRecord, field: string, fallback = false): boolean {
    const value = obj.get(field);
    return typeof value === 'boolean' ? value : fallback;
  }

  protected resolveDate(obj: RawRecord, field: string): string | undefined {
    const value = obj.get(field);
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' && value.length > 0) return value;
    return undefined;
  }

  protected resolveEnum<TValue extends string>(
    obj: RawRecord,
    field: string,
    allowed: readonly TValue[],
    fallback: TValue,
  ): TValue {
    const value = obj.get(field);
    if (typeof value !== 'string') return fallback;
    return (allowed as readonly string[]).includes(value) ? (value as TValue) : fallback;
  }
}
