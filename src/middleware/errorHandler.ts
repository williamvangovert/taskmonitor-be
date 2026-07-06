import { NextFunction, Request, Response } from 'express';

/** Error carrying an HTTP status code. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** 404 handler for unmatched routes. */
export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not Found' });
}

/** Central error handler — keeps error responses in a consistent JSON shape. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Internal Server Error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({ message });
}
