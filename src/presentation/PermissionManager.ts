import type { Permission } from '../domain/entities/Permission';
import type { PermissionType } from '../domain/entities/PermissionType';
import { PermissionStatus } from '../domain/entities/PermissionStatus';
import { PermissionManagerContainer } from '../di/container';
import type { PermissionResult } from '../types/PermissionResult';
import type { PermissionGroupResult } from '../types/PermissionGroupResult';
import type {
  PermissionInput,
  PermissionListener,
  PermissionOptions,
  PermissionUnsubscribe,
} from '../types/permissions';
import { isGrantedStatus, resolvePermissionType } from '../types/permissions';
import type { PermissionGroupInput, PermissionGroupName } from '../types/permissionGroups';
import { resolvePermissionGroup } from '../types/permissionGroups';
import { presentPermissionDialog } from './utils/presentPermissionDialog';
import { Logger } from '../utils/Logger';
import { isAndroid } from '../utils/PlatformUtils';

/**
 * Public-facing Facade over the use-case layer (Facade + Singleton).
 *
 * `import { PermissionManager } from 'react-native-permission-manager'`
 */
export class PermissionManager {
  private static readonly listeners = new Set<PermissionListener>();
  private static readonly cache = new Map<PermissionType, PermissionResult>();

  public static async check(permission: PermissionInput): Promise<PermissionResult> {
    const type = resolvePermissionType(permission);
    const deps = PermissionManagerContainer.resolve();
    const entity = await deps.checkPermissionUseCase.execute(type);
    return PermissionManager.publish(entity);
  }

  public static async request(
    permission: PermissionInput,
    options?: PermissionOptions,
  ): Promise<PermissionResult> {
    const type = resolvePermissionType(permission);
    const deps = PermissionManagerContainer.resolve();

    const rationaleEnabled = options?.showRationale !== false && isAndroid();
    if (rationaleEnabled) {
      // Only show the rationale dialog when Android actually recommends it
      // (i.e. after a prior denial). Passing `title`/`message` customizes the
      // dialog's *content* — it must never be what *triggers* it, otherwise
      // every request() call would pop the dialog unconditionally.
      const shouldShow = await deps.shouldShowRationaleUseCase.execute(type);
      if (shouldShow) {
        const confirmed = await presentPermissionDialog({
          permission: type,
          kind: 'rationale',
          options,
        });
        if (!confirmed) {
          return PermissionManager.check(type);
        }
      }
    }

    const entity = await deps.requestPermissionUseCase.execute(type);

    if (entity.status === PermissionStatus.BLOCKED && options?.redirectToSettingsOnBlocked) {
      return PermissionManager.ensure(type, {
        ...options,
        redirectToSettingsOnBlocked: true,
      });
    }

    return PermissionManager.publish(entity);
  }

  public static async requestMultiple(
    permissions: readonly PermissionInput[],
    _options?: PermissionOptions,
  ): Promise<readonly PermissionResult[]> {
    const types = permissions.map(resolvePermissionType);
    const deps = PermissionManagerContainer.resolve();
    const entities = await deps.requestMultiplePermissionsUseCase.execute(types);
    return entities.map(entity => PermissionManager.publish(entity));
  }

  /** Checks every permission in a built-in or ad-hoc group (no prompt). */
  public static async checkGroup(group: PermissionGroupInput): Promise<PermissionGroupResult> {
    const permissions = resolvePermissionGroup(group);
    const results = await Promise.all(permissions.map(p => PermissionManager.check(p)));
    return PermissionManager.toGroupResult(group, results);
  }

  /** Requests every permission in a built-in or ad-hoc group in one call. */
  public static async requestGroup(
    group: PermissionGroupInput,
    options?: PermissionOptions,
  ): Promise<PermissionGroupResult> {
    const permissions = resolvePermissionGroup(group);
    const results = await PermissionManager.requestMultiple(permissions, options);
    return PermissionManager.toGroupResult(group, results);
  }

  private static toGroupResult(
    group: PermissionGroupInput,
    results: readonly PermissionResult[],
  ): PermissionGroupResult {
    return {
      group: typeof group === 'string' ? (group as PermissionGroupName) : undefined,
      results,
      allGranted: results.length > 0 && results.every(r => isGrantedStatus(r.status)),
      anyGranted: results.some(r => isGrantedStatus(r.status)),
    };
  }

  /**
   * Ensure a permission is granted. Requests if needed; if permanently
   * denied, shows a dialog and opens Settings (then re-checks).
   */
  public static async ensure(
    permission: PermissionInput,
    options?: PermissionOptions,
  ): Promise<PermissionResult> {
    const type = resolvePermissionType(permission);
    const deps = PermissionManagerContainer.resolve();

    const entity = await deps.ensurePermissionUseCase.execute({
      type,
      recheckAfterSettings: true,
      onBlocked: async () => {
        if (options?.redirectToSettingsOnBlocked === false) {
          return false;
        }
        return presentPermissionDialog({
          permission: type,
          kind: 'settings',
          options,
        });
      },
    });

    return PermissionManager.publish(entity);
  }

  public static async shouldShowRationale(permission: PermissionInput): Promise<boolean> {
    const type = resolvePermissionType(permission);
    const deps = PermissionManagerContainer.resolve();
    return deps.shouldShowRationaleUseCase.execute(type);
  }

  public static async openSettings(): Promise<void> {
    const deps = PermissionManagerContainer.resolve();
    await deps.openAppSettingsUseCase.execute();
  }

  /** @deprecated Prefer {@link openSettings}. */
  public static openAppSettings(): Promise<void> {
    return PermissionManager.openSettings();
  }

  public static addListener(listener: PermissionListener): PermissionUnsubscribe {
    PermissionManager.listeners.add(listener);
    return () => {
      PermissionManager.listeners.delete(listener);
    };
  }

  public static removeListener(listener: PermissionListener): void {
    PermissionManager.listeners.delete(listener);
  }

  /** Returns a cached snapshot if available (no native I/O). */
  public static getCached(permission: PermissionInput): PermissionResult | undefined {
    const type = resolvePermissionType(permission);
    return PermissionManager.cache.get(type);
  }

  /** Clears the in-memory cache (and optionally all listeners). */
  public static clearCache(): void {
    PermissionManager.cache.clear();
  }

  public static isGranted(result: PermissionResult | undefined): boolean {
    return result != null && isGrantedStatus(result.status);
  }

  private static publish(entity: Permission): PermissionResult {
    const result: PermissionResult = {
      type: entity.type,
      status: entity.status,
      canAskAgain: entity.canAskAgain,
    };
    const previous = PermissionManager.cache.get(entity.type);
    PermissionManager.cache.set(entity.type, result);

    if (
      previous == null ||
      previous.status !== result.status ||
      previous.canAskAgain !== result.canAskAgain
    ) {
      Logger.debug(`status changed: ${result.type} → ${result.status}`);
      for (const listener of PermissionManager.listeners) {
        try {
          void listener(result);
        } catch (error) {
          Logger.error('Permission listener threw', error);
        }
      }
    }

    return result;
  }
}
