import type { RequestContext } from './request-context.js';
import type { ValidatedInput } from '../validation/validate.middleware.js';

declare module 'express-serve-static-core' {
  interface Request {
    ctx: RequestContext;
    valid: ValidatedInput;
  }
}
