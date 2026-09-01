import { LOAN_PERIOD_DAYS } from '../../config/constants.js';
import type { RequestContext } from '../../core/http/request-context.js';
import { BaseRepository } from '../base/base.repository.js';
import { LoanMapper } from './loan.mapper.js';
import type { CreateLoanData, Loan, LoanDetail } from './loan.types.js';

export class LoanRepository extends BaseRepository<Loan> {
  protected override readonly className = 'Loan';
  protected override readonly mapper = new LoanMapper();
  protected override readonly searchField = 'borrowerName';

  async createLoan(ctx: RequestContext, data: CreateLoanData): Promise<LoanDetail> {
    const loanedAt = new Date();
    const dueAt = new Date(loanedAt);
    dueAt.setDate(dueAt.getDate() + LOAN_PERIOD_DAYS);

    const created = await this.create(ctx, { ...data, loanedAt, dueAt });
    return this.mapper.toDetail(created);
  }
}
