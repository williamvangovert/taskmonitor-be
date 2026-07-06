/**
 * Convert a camelCase key to snake_case (e.g. startDate -> start_date).
 */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

/**
 * Recursively convert all object keys in a value to snake_case.
 *
 * The old Laravel API emitted snake_case JSON, but Prisma returns camelCase.
 * Running responses through this keeps the API shape identical for the frontend.
 * Dates and other non-plain objects are left untouched.
 */
export function snakeCaseKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(snakeCaseKeys);
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    (value as { constructor?: unknown }).constructor === Object
  ) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[camelToSnake(key)] = snakeCaseKeys(val);
    }
    return result;
  }

  return value;
}
