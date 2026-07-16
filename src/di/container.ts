import type { IPermissionRepository } from '../domain/repositories/IPermissionRepository';
import type { IPermissionDataSource } from '../data/datasources/IPermissionDataSource';
import { NativePermissionDataSource } from '../data/datasources/NativePermissionDataSource';
import { PermissionRepository } from '../data/repositories/PermissionRepository';
import {
  CheckPermissionUseCase,
  RequestPermissionUseCase,
  RequestMultiplePermissionsUseCase,
  OpenAppSettingsUseCase,
  ShouldShowRationaleUseCase,
  EnsurePermissionUseCase,
} from '../domain/usecases';

/**
 * Composition root (DI container).
 */
export interface PermissionManagerDependencies {
  dataSource: IPermissionDataSource;
  repository: IPermissionRepository;
  checkPermissionUseCase: CheckPermissionUseCase;
  requestPermissionUseCase: RequestPermissionUseCase;
  requestMultiplePermissionsUseCase: RequestMultiplePermissionsUseCase;
  openAppSettingsUseCase: OpenAppSettingsUseCase;
  shouldShowRationaleUseCase: ShouldShowRationaleUseCase;
  ensurePermissionUseCase: EnsurePermissionUseCase;
}

export class PermissionManagerContainer {
  private static instance: PermissionManagerDependencies | undefined;

  /** Returns the (lazily constructed) singleton dependency graph. */
  public static resolve(): PermissionManagerDependencies {
    if (PermissionManagerContainer.instance === undefined) {
      PermissionManagerContainer.instance = PermissionManagerContainer.createDefault();
    }
    return PermissionManagerContainer.instance;
  }

  /** Allows tests / consumers to inject a fully custom dependency graph. */
  public static override(deps: Partial<PermissionManagerDependencies>): void {
    if (PermissionManagerContainer.instance === undefined) {
      if (PermissionManagerContainer.isComplete(deps)) {
        PermissionManagerContainer.instance = deps;
        return;
      }
      PermissionManagerContainer.instance = PermissionManagerContainer.createDefault();
    }
    PermissionManagerContainer.instance = {
      ...PermissionManagerContainer.instance,
      ...deps,
    };
  }

  /** Resets the container (primarily for test isolation). */
  public static reset(): void {
    PermissionManagerContainer.instance = undefined;
  }

  private static isComplete(
    deps: Partial<PermissionManagerDependencies>,
  ): deps is PermissionManagerDependencies {
    return (
      deps.dataSource != null &&
      deps.repository != null &&
      deps.checkPermissionUseCase != null &&
      deps.requestPermissionUseCase != null &&
      deps.requestMultiplePermissionsUseCase != null &&
      deps.openAppSettingsUseCase != null &&
      deps.shouldShowRationaleUseCase != null &&
      deps.ensurePermissionUseCase != null
    );
  }

  private static createDefault(): PermissionManagerDependencies {
    const dataSource = new NativePermissionDataSource();
    const repository = new PermissionRepository(dataSource);
    return {
      dataSource,
      repository,
      checkPermissionUseCase: new CheckPermissionUseCase(repository),
      requestPermissionUseCase: new RequestPermissionUseCase(repository),
      requestMultiplePermissionsUseCase: new RequestMultiplePermissionsUseCase(repository),
      openAppSettingsUseCase: new OpenAppSettingsUseCase(repository),
      shouldShowRationaleUseCase: new ShouldShowRationaleUseCase(repository),
      ensurePermissionUseCase: new EnsurePermissionUseCase(repository),
    };
  }
}
