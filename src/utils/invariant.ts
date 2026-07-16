/**
 * Runtime assertion helper used across the library.
 * Throws a typed Error with a stable prefix for easier debugging.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[PermissionManager] ${message}`);
  }
}
