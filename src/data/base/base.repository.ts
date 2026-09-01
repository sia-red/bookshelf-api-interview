import type { RequestContext } from '../../core/http/request-context.js';
import type { PaginatedMeta } from '../../core/http/response.types.js';
import type { Logger } from '../../core/logger/logger.js';
import { getStore } from '../../core/persistence/store-factory.js';
import {
  RecordNotFoundError,
  type RawQuery,
  type RawRecord,
  type Store,
} from '../../core/persistence/store.js';
import { escapeRegExp } from '../../core/utils/regex.utils.js';
import type { BaseMapper } from './base.mapper.js';
import type { BaseModel, ListParams } from './base.types.js';
import type { QueryCustomizer } from './repository.types.js';

const GET_ALL_LIMIT = 1000;

export abstract class BaseRepository<TModel extends BaseModel> {
  protected abstract readonly className: string;
  protected abstract readonly mapper: BaseMapper<TModel>;
  protected readonly searchField: string = 'name';
  protected readonly softDeleteField: string = 'deleted';
  protected readonly store: Store = getStore();
  protected readonly logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger.child(`[${this.constructor.name}]`);
  }

  async getAll(ctx: RequestContext): Promise<TModel[]> {
    const query = this.createQuery();
    query.limit(GET_ALL_LIMIT);
    const results = await query.find();
    this.logger.info(`Found ${results.length} records`, { requestId: ctx.requestId });
    return this.mapper.toModelArray(results);
  }

  async getList(
    ctx: RequestContext,
    params: ListParams,
    customize?: QueryCustomizer,
  ): Promise<{ data: TModel[]; meta: PaginatedMeta }> {
    const { results, total } = await this.executeListQuery(ctx, params, customize);
    return {
      data: this.mapper.toModelArray(results),
      meta: { total, page: params.page, pageSize: params.pageSize },
    };
  }

  async getById(ctx: RequestContext, id: string): Promise<TModel | undefined> {
    const record = await this.findRecord(id);
    if (!record) {
      this.logger.debug(`Record ${id} not found`, { requestId: ctx.requestId });
      return undefined;
    }
    return this.mapper.toModel(record);
  }

  async create(ctx: RequestContext, data: Record<string, unknown>): Promise<TModel> {
    const record = this.store.create(this.className);
    for (const [field, value] of Object.entries(data)) {
      record.set(field, value);
    }
    const saved = await this.store.saveRecord(record);
    this.logger.info(`Created record ${saved.id}`, { requestId: ctx.requestId });
    return this.mapper.toModel(saved);
  }

  /** The updated model, or `undefined` when the record no longer exists. */
  async update(
    ctx: RequestContext,
    id: string,
    data: Record<string, unknown>,
    unsetFields?: string[],
  ): Promise<TModel | undefined> {
    const record = await this.findRecord(id);
    if (!record) return undefined;

    for (const [field, value] of Object.entries(data)) {
      record.set(field, value);
    }
    for (const field of unsetFields ?? []) {
      record.unset(field);
    }

    const saved = await this.store.saveRecord(record);
    this.logger.info(`Updated record ${id}`, {
      requestId: ctx.requestId,
      fields: record.dirtyKeys(),
    });
    return this.mapper.toModel(saved);
  }

  /**
   * Marks the record as deleted instead of removing it. Rows are never dropped: a catalogue entry
   * may still be referenced by historical data, and a hard delete would take that history with it.
   */
  async softDelete(ctx: RequestContext, id: string): Promise<TModel | undefined> {
    const record = await this.findRecord(id);
    if (!record) return undefined;

    record.set(this.softDeleteField, true);
    record.set('deletedAt', new Date());

    const saved = await this.store.saveRecord(record);
    this.logger.info(`Soft-deleted record ${id}`, { requestId: ctx.requestId });
    return this.mapper.toModel(saved);
  }

  protected async executeListQuery(
    ctx: RequestContext,
    params: ListParams,
    customize?: QueryCustomizer,
  ): Promise<{ results: RawRecord[]; total: number }> {
    const query = this.createQuery();
    const countQuery = this.createQuery();

    if (customize) {
      customize(query);
      customize(countQuery);
    }

    if (params.search) {
      const pattern = new RegExp(escapeRegExp(params.search), 'i');
      query.matches(this.searchField, pattern);
      countQuery.matches(this.searchField, pattern);
    }

    const sortField = params.sortBy ?? this.searchField;
    if (params.sortOrder === 'desc') query.descending(sortField);
    else query.ascending(sortField);

    query.skip(params.page * params.pageSize);
    query.limit(params.pageSize);

    const [results, total] = await Promise.all([query.find(), countQuery.count()]);
    this.logger.info(`Found ${results.length} of ${total} records`, {
      requestId: ctx.requestId,
    });
    return { results, total };
  }

  /** The base query for every read: the soft-delete constraint is applied here, once. */
  protected createQuery(): RawQuery {
    const query = this.store.query(this.className);
    query.notEqualTo(this.softDeleteField, true);
    return query;
  }

  private async findRecord(id: string): Promise<RawRecord | undefined> {
    try {
      return await this.store.getRecord(this.createQuery(), id);
    } catch (error) {
      if (error instanceof RecordNotFoundError) return undefined;
      throw error;
    }
  }
}
