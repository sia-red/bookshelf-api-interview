import type { BaseModel } from '../base/base.types.js';

/**
 * A copy of a book in someone's hands.
 *
 * Dates are ISO strings here, as everywhere else in this project: the store deals in `Date` objects
 * and the mapper is what normalises them on the way out.
 */
export interface Loan extends BaseModel {
  bookId: string;
  borrowerName: string;
  loanedAt: string;
  dueAt: string;
  returnedAt?: string;
}

export interface LoanDetail extends Loan {
  returned: boolean;
}

/**
 * What a caller has to supply to open a loan.
 *
 * `loanedAt` and `dueAt` are absent on purpose — when the loan happened is a fact about the write,
 * and the lending period is a library-wide constant, so the repository stamps both.
 */
export interface CreateLoanData {
  bookId: string;
  borrowerName: string;
}
