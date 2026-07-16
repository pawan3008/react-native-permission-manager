import type { PermissionResult } from './PermissionResult';
import type { PermissionGroupName } from './permissionGroups';

/**
 * Aggregate result returned from group-level checks/requests
 * (`PermissionManager.checkGroup`, `requestGroup`, `usePermissionGroup`).
 */
export interface PermissionGroupResult {
  /** Name of the built-in group, or `undefined` for an ad-hoc list. */
  group: PermissionGroupName | undefined;
  /** Per-permission results, in the same order as the input list. */
  results: readonly PermissionResult[];
  /** `true` only if every permission in the group is granted (or limited). */
  allGranted: boolean;
  /** `true` if at least one permission in the group is granted (or limited). */
  anyGranted: boolean;
}
