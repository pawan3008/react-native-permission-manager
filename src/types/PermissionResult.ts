import type { PermissionStatus } from '../domain/entities/PermissionStatus';
import type { PermissionType } from '../domain/entities/PermissionType';

/**
 * Public-facing (presentation layer) shape returned from hooks/facade
 * methods. Distinct from the domain `Permission` entity so the public API
 * can evolve independently of internal domain modeling.
 */
export interface PermissionResult {
  type: PermissionType;
  status: PermissionStatus;
  canAskAgain: boolean;
}
