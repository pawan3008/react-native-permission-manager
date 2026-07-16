import type { IUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';
import type { Permission } from '../entities/Permission';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Use case: prompt the user to grant a batch of permissions in one call.
 */
export class RequestMultiplePermissionsUseCase implements IUseCase<
  readonly PermissionType[],
  readonly Permission[]
> {
  constructor(private readonly repository: IPermissionRepository) {}

  public execute(types: readonly PermissionType[]): Promise<readonly Permission[]> {
    return this.repository.requestMultiple(types);
  }
}
