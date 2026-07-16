import type { IUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';
import type { Permission } from '../entities/Permission';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Use case: prompt the user (if necessary) to grant a single permission.
 */
export class RequestPermissionUseCase implements IUseCase<PermissionType, Permission> {
  constructor(private readonly repository: IPermissionRepository) {}

  public execute(type: PermissionType): Promise<Permission> {
    return this.repository.request(type);
  }
}
