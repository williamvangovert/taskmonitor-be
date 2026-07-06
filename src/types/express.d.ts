import type { User } from '@prisma/client';

// Attach the authenticated user to the Express request (set by the auth
// middleware) so route handlers can read req.user with full typing.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
