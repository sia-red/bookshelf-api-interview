import type { Request, Response } from 'express';
import { container } from '../../bootstrap/container.js';
import { successResponse } from '../../core/http/response.types.js';
import { getStore } from '../../core/persistence/store-factory.js';
import type { BookIdParams, BookListQuery, CreateBookBody } from './book.schemas.js';

export class BookController {
  static async getList(req: Request, res: Response): Promise<void> {
    const query = req.valid.query as BookListQuery;
    const result = await container().bookRepo.getListItems(req.ctx, query);
    const total = await getStore().query('Book').notEqualTo('deleted', true).count();
    res.json({ ...successResponse(result.data), meta: { ...result.meta, total } });
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.valid.params as BookIdParams;
    const book = await container().bookRepo.getDetail(req.ctx, id);
    res.json(successResponse(book ?? null));
  }

  static async create(req: Request, res: Response): Promise<void> {
    const body = req.valid.body as CreateBookBody;
    const book = await container().bookService.create(req.ctx, body);
    res.status(201).json(successResponse(book));
  }
}
