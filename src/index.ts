/**
 * Public exports. Keep this surface small — prefer the presentation API
 * and the shared types/enums apps actually need.
 */

export * from './presentation';

export { PermissionType } from './domain/entities/PermissionType';
export { PermissionStatus } from './domain/entities/PermissionStatus';
export * from './domain/errors';
export * from './types';
