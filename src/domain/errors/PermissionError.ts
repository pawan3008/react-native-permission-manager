import type { PermissionType } from '../entities/PermissionType';

/**
 * Base class for all domain-level permission errors.
 */
export abstract class PermissionError extends Error {
  public abstract readonly code: string;
  public readonly permissionType?: PermissionType;

  protected constructor(message: string, permissionType?: PermissionType) {
    super(message);
    this.name = new.target.name;
    this.permissionType = permissionType;
  }
}
