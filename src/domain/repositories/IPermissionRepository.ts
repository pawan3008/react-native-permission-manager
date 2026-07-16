import type { Permission } from '../entities/Permission';
import type { PermissionType } from '../entities/PermissionType';

/**
 * Domain-level repository contract (Dependency Inversion Principle).
 *
 * The domain layer depends only on this interface — never on the concrete
 * implementation in `src/data`, and never on React Native APIs directly.
 * This keeps use cases unit-testable in isolation via a mock/fake repository.
 */
export interface IPermissionRepository {
  check(type: PermissionType): Promise<Permission>;
  request(type: PermissionType): Promise<Permission>;
  requestMultiple(types: readonly PermissionType[]): Promise<readonly Permission[]>;
  shouldShowRationale(type: PermissionType): Promise<boolean>;
  openAppSettings(): Promise<void>;
}
