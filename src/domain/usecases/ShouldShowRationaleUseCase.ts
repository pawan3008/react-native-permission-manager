import type { IUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Use case: determine whether the app should show a custom rationale UI
 * before requesting a permission.
 */
export class ShouldShowRationaleUseCase implements IUseCase<PermissionType, boolean> {
  constructor(private readonly repository: IPermissionRepository) {}

  public execute(type: PermissionType): Promise<boolean> {
    return this.repository.shouldShowRationale(type);
  }
}
