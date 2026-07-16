import type { PermissionType } from './PermissionType';
import type { PermissionStatus } from './PermissionStatus';

/**
 * Domain entity: an immutable snapshot of a single permission's state.
 *
 * This is the core object passed between the domain and presentation layers.
 * It intentionally has no dependency on React or React Native.
 */
export interface Permission {
  readonly type: PermissionType;
  readonly status: PermissionStatus;
  readonly canAskAgain: boolean;
  readonly checkedAt: number;
}
