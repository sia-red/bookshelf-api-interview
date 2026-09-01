import type { RawRecord } from '../../core/persistence/store.js';
import { BaseMapper } from '../base/base.mapper.js';
import type { Loan, LoanDetail } from './loan.types.js';

export class LoanMapper extends BaseMapper<Loan> {
  toModel(obj: RawRecord): Loan {
    const returnedAt = this.resolveDate(obj, 'returnedAt');

    return {
      ...this.resolveBaseFields(obj),
      bookId: this.resolveString(obj, 'bookId'),
      borrowerName: this.resolveString(obj, 'borrowerName'),
      loanedAt: this.resolveDate(obj, 'loanedAt') ?? '',
      dueAt: this.resolveDate(obj, 'dueAt') ?? '',
      ...(returnedAt !== undefined ? { returnedAt } : {}),
    };
  }

  toDetail(model: Loan): LoanDetail {
    return {
      ...model,
      returned: model.returnedAt !== undefined,
    };
  }
}
