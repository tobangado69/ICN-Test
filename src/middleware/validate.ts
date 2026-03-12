import type { Request, Response, NextFunction, RequestHandler } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { ValidationError } from '../shared/errors';

export function validate(schema: ZodSchema): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const input = { body: req.body, query: req.query, params: req.params };

    try {
      schema.parse(input);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        const details = e.issues.map((issue) => ({
          field: issue.path.filter(Boolean).join('.'),
          message: issue.message,
        }));

        next(new ValidationError('Validation failed', details));
      } else {
        next(e);
      }
    }
  };
}
