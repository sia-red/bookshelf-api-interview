import { AppError } from '../../core/errors/app-error.js';
import { ERROR_CODES } from '../../core/errors/error-codes.js';
import type { RequestContext } from '../../core/http/request-context.js';
import type { BookRepository } from '../../data/book/book.repository.js';
import type { BookDetail } from '../../data/book/book.types.js';
import type { CreateBookBody } from './book.schemas.js';

export interface BookServiceDeps {
  bookRepo: BookRepository;
}

/**
 * Where the catalogue's rules live.
 *
 * A controller reads the request and writes the response; a repository reads and writes records.
 * Anything that decides whether an operation is allowed at all belongs here, so the same rule holds
 * no matter which endpoint or job reaches it.
 */
export class BookService {
  private readonly bookRepo: BookRepository;

  constructor(deps: BookServiceDeps) {
    this.bookRepo = deps.bookRepo;
  }

  async create(ctx: RequestContext, input: CreateBookBody): Promise<BookDetail> {
    const existing = await this.bookRepo.findByIsbn(ctx, input.isbn);
    if (existing) {
      throw AppError.conflict(
        ERROR_CODES.BOOK_ISBN_TAKEN,
        `A book with ISBN ${input.isbn} is already in the catalogue`,
      );
    }

    // Omitting `copiesAvailable` means "every copy is on the shelf".
    const copiesAvailable = input.copiesAvailable ?? input.copiesTotal;
    if (copiesAvailable > input.copiesTotal) {
      throw AppError.badRequest(
        ERROR_CODES.BOOK_COPIES_INVALID,
        `copiesAvailable (${copiesAvailable}) cannot exceed copiesTotal (${input.copiesTotal})`,
      );
    }

    return this.bookRepo.createBook(ctx, { ...input, copiesAvailable });
  }
}
