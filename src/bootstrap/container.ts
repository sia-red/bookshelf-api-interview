import type { Logger } from '../core/logger/logger.js';
import { BookRepository } from '../data/book/book.repository.js';
import { LoanRepository } from '../data/loan/loan.repository.js';
import { BookService } from '../features/book/book.service.js';
import type { Container } from './container.types.js';

let instance: Container | undefined;

/**
 * Builds every singleton, once, at startup — and it is the only place allowed to.
 *
 * Wiring lives here so a repository never constructs its own collaborators and a service never
 * reaches for a global. Persistence must already be initialised when this runs: repositories resolve
 * the store as they are constructed.
 */
export function createContainer(logger: Logger): Container {
  const bookRepo = new BookRepository(logger);
  const loanRepo = new LoanRepository(logger);
  const bookService = new BookService({ bookRepo });

  instance = { bookRepo, bookService, loanRepo };
  return instance;
}

export function container(): Container {
  if (!instance) {
    throw new Error('Container not initialized. Call createContainer() first.');
  }
  return instance;
}
