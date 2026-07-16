/**
 * Public API surface of `react-native-permission-manager`.
 *
 * Only the presentation layer and the public-facing domain
 * entities/types are re-exported here. Internal layers (`data`, `native`,
 * `di`) are intentionally NOT exported from this barrel to keep the
 * library's public contract small and stable.
 */

// Presentation layer: facade, hooks, components — the main public API.
export * from './presentation';

// Domain entities/enums are part of the public type surface (consumers
// need `PermissionType`/`PermissionStatus` to call the API).
export { PermissionType } from './domain/entities/PermissionType';
export { PermissionStatus } from './domain/entities/PermissionStatus';

// Domain errors are public so consumers can `instanceof` check them.
export * from './domain/errors';

// Public-facing shared types.
export * from './types';
