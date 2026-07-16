import { PermissionError } from './PermissionError';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Concrete permission error for operational / mapping failures.
 */
export class PermissionOperationError extends PermissionError {
  public readonly code = 'E_PERMISSION_OPERATION';

  constructor(message: string, permissionType?: PermissionType) {
    super(message, permissionType);
  }
}
