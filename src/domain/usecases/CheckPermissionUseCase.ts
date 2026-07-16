import type { IUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';
import type { Permission } from '../entities/Permission';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Use case: read the current status of a single permission without
 * prompting the user.
 */
export class CheckPermissionUseCase implements IUseCase<PermissionType, Permission> {
  constructor(private readonly repository: IPermissionRepository) {}

  public execute(type: PermissionType): Promise<Permission> {
    return this.repository.check(type);
  }
}
