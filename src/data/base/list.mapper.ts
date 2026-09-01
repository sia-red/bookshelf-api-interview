import { BaseMapper } from './base.mapper.js';
import type { BaseModel } from './base.types.js';

/**
 * A mapper with one method per response shape.
 *
 * The domain model is not automatically a response body: a list needs the few columns a table shows,
 * a detail needs more, and each is declared on its own so adding a field to the model never silently
 * widens what an endpoint returns.
 */
export abstract class ListMapper<TModel extends BaseModel, TListItem> extends BaseMapper<TModel> {
  abstract toListItem(model: TModel): TListItem;

  toListItemArray(models: TModel[]): TListItem[] {
    return models.map((model) => this.toListItem(model));
  }
}
