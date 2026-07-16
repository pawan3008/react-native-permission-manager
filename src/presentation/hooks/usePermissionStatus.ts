import { usePermission } from './usePermission';
import type { PermissionInput } from '../../types/permissions';
import { PermissionStatus } from '../../domain/entities/PermissionStatus';

/**
 * Lightweight hook that only exposes the current status of a permission.
 */
export function usePermissionStatus(permission: PermissionInput): PermissionStatus | undefined {
  return usePermission(permission).status;
}
