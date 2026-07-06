import { NextFunction, Request, Response } from 'express';
import { ZodError, ZodSchema } from 'zod';

function formatZodErrors(error: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'value';
    (errors[key] ??= []).push(issue.message);
  }
  return errors;
}

/**
 * Validate req.body against a Zod schema. On failure, respond with the same
 * shape Laravel's ValidationException produces: HTTP 422 { message, errors }.
 * On success, req.body is replaced with the parsed (typed) data.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      const message = Object.values(errors)[0]?.[0] ?? 'The given data was invalid.';
      res.status(422).json({ message, errors });
      return;
    }
    req.body = result.data;
    next();
  };
}
