import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client for the whole app.
 */
export const prisma = new PrismaClient();

// The database uses bigint primary keys, which Prisma returns as JavaScript
// BigInt. JSON.stringify cannot serialize BigInt by default, and the old
// Laravel API emitted these IDs as plain numbers. Teach BigInt to serialize as
// a number so response shapes match the previous backend.
// (Response-shape parity is finalised in Stage 2.)
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function toJSON(this: bigint) {
  return Number(this);
};
