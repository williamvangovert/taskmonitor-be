import bcrypt from 'bcryptjs';

/** Hash a plaintext password. */
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * Verify a plaintext password against a stored hash.
 *
 * Laravel/PHP produces bcrypt hashes with the $2y$ version tag. bcryptjs
 * verifies $2b$ hashes; the two are the same algorithm and differ only in the
 * version tag, so we normalise $2y$ -> $2b$ before comparing. This lets every
 * existing user log in with their current password.
 */
export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const normalised = hash.startsWith('$2y$') ? `$2b$${hash.slice(4)}` : hash;
  return bcrypt.compare(plain, normalised);
}
