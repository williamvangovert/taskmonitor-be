import { HttpError } from '../middleware/errorHandler';

/** Parse a route param into a bigint id, or 404 if it is not numeric. */
export function parseId(value: string | undefined): bigint {
  if (!value || !/^\d+$/.test(value)) {
    throw new HttpError(404, 'Not Found');
  }
  return BigInt(value);
}

/** Coerce an incoming value (number | numeric string | null | '') to bigint | null. */
export function toBigIntOrNull(value: unknown): bigint | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return BigInt(Math.trunc(value));
  if (typeof value === 'string' && /^\d+$/.test(value)) return BigInt(value);
  return null;
}
