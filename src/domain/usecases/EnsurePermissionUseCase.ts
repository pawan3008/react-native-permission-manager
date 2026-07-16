import type { IUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';
import type { Permission } from '../entities/Permission';
import type { PermissionType } from '../entities/PermissionType';
import { PermissionStatus } from '../entities/PermissionStatus';

export interface EnsurePermissionInput {
  type: PermissionType;
  /** Invoked when the permission is blocked; should return true to open settings. */
  onBlocked?: (permission: Permission) => Promise<boolean>;
  /** Wait/re-check after returning from settings. */
  recheckAfterSettings?: boolean;
}

/**
 * Use case: guarantee a usable permission status.
 *
 * Flow: check → if undetermined/denied request → if blocked optionally
 * open settings and re-check.
 */
export class EnsurePermissionUseCase implements IUseCase<EnsurePermissionInput, Permission> {
  constructor(private readonly repository: IPermissionRepository) {}

  public async execute(input: EnsurePermissionInput): Promise<Permission> {
    let permission = await this.repository.check(input.type);

    if (
      permission.status === PermissionStatus.GRANTED ||
      permission.status === PermissionStatus.LIMITED
    ) {
      return permission;
    }

    if (
      permission.status === PermissionStatus.DENIED ||
      permission.status === PermissionStatus.NOT_DETERMINED
    ) {
      permission = await this.repository.request(input.type);
    }

    if (permission.status === PermissionStatus.BLOCKED && input.onBlocked != null) {
      const shouldOpen = await input.onBlocked(permission);
      if (shouldOpen) {
        await this.repository.openAppSettings();
        if (input.recheckAfterSettings !== false) {
          permission = await this.repository.check(input.type);
        }
      }
    }

    return permission;
  }
}
