import { Router } from 'express';
import { validate } from '../../core/validation/validate.middleware.js';
import { BookController } from './book.controller.js';
import { bookIdParamsSchema, bookListQuerySchema, createBookBodySchema } from './book.schemas.js';

export function bookRoutes(): Router {
  const router = Router();

  router.get('/', validate({ query: bookListQuerySchema }), BookController.getList);

  router.get('/:id', validate({ params: bookIdParamsSchema }), BookController.getById);

  router.post('/', validate({ body: createBookBodySchema }), BookController.create);

  return router;
}
