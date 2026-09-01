import type { RequestHandler } from 'express';
import * as v from 'valibot';
import { AppError } from '../errors/app-error.js';
import { ERROR_CODES } from '../errors/error-codes.js';

export interface ValidatedInput {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

type Part = keyof ValidatedInput;

export type ValidationSchemas = {
  [K in Part]?: v.GenericSchema;
};

interface ValidationIssue {
  path: string;
  message: string;
  type: string;
}

function formatIssues(issues: readonly v.BaseIssue<unknown>[]): ValidationIssue[] {
  return issues.map((issue) => ({
    path: v.getDotPath(issue) ?? '',
    message: issue.message,
    type: issue.type,
  }));
}

// Validated values land on `req.valid`, never back on `req.body` / `req.query`: in Express 5
// `req.query` is a getter with no setter, so assigning to it throws under ESM strict mode.
export function validate(schemas: ValidationSchemas): RequestHandler {
  const parts = Object.keys(schemas) as Part[];

  return (req, _res, next) => {
    for (const part of parts) {
      const schema = schemas[part];
      if (!schema) continue;

      const result = v.safeParse(schema, req[part]);
      if (!result.success) {
        throw AppError.badRequest(
          ERROR_CODES.VALIDATION_ERROR,
          `Invalid request ${part}`,
          formatIssues(result.issues),
        );
      }
      req.valid[part] = result.output;
    }
    next();
  };
}
