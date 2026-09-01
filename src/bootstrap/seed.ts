import books from '../data/fixtures/books.json' with { type: 'json' };
import loans from '../data/fixtures/loans.json' with { type: 'json' };
import type { Store } from '../core/persistence/store.js';

export const BOOK_CLASS_NAME = 'Book';
export const LOAN_CLASS_NAME = 'Loan';

/** Loads the shipped catalogue so the API answers with real data on a cold start. */
export function seedFixtures(store: Store): void {
  store.seed(BOOK_CLASS_NAME, books);
  store.seed(LOAN_CLASS_NAME, loans);
}
