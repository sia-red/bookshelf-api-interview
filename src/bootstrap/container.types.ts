import type { BookRepository } from '../data/book/book.repository.js';
import type { LoanRepository } from '../data/loan/loan.repository.js';
import type { BookService } from '../features/book/book.service.js';

export interface Container {
  bookRepo: BookRepository;
  bookService: BookService;
  loanRepo: LoanRepository;
}
