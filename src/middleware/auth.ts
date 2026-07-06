import { NextFunction, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../utils/jwt';
import { HttpError } from './errorHandler';

/**
 * Require a valid Bearer JWT. Loads the user and attaches it as req.user.
 * Responds 401 on any failure — the frontend's axios interceptor treats 401 as
 * "logged out" and redirects to /login, matching the old Sanctum behaviour.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const header = req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    let userId: bigint;
    try {
      userId = BigInt(verifyToken(token).sub);
    } catch {
      throw new HttpError(401, 'Unauthenticated.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new HttpError(401, 'Unauthenticated.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
