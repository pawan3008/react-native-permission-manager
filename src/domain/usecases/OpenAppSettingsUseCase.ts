import type { INoInputUseCase } from './IUseCase';
import type { IPermissionRepository } from '../repositories/IPermissionRepository';

/**
 * Use case: deep-link the user into the OS app settings screen.
 */
export class OpenAppSettingsUseCase implements INoInputUseCase<void> {
  constructor(private readonly repository: IPermissionRepository) {}

  public execute(): Promise<void> {
    return this.repository.openAppSettings();
  }
}
