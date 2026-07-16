import type { IPermissionRepository } from '../../domain/repositories/IPermissionRepository';
import type { IPermissionDataSource } from '../datasources/IPermissionDataSource';
import type { Permission } from '../../domain/entities/Permission';
import type { PermissionType } from '../../domain/entities/PermissionType';
import { PermissionStatus } from '../../domain/entities/PermissionStatus';
import { PermissionTypeMapper } from '../mappers/PermissionTypeMapper';
import { PermissionStatusMapper } from '../mappers/PermissionStatusMapper';
import { Logger } from '../../utils/Logger';
import { isAndroid } from '../../utils/PlatformUtils';

/**
 * Maps domain types ↔ native keys/statuses and calls the data source.
 */
export class PermissionRepository implements IPermissionRepository {
  /** Dedup undeclared-permission console warnings (one per native key). */
  private static readonly warnedUndeclared = new Set<string>();

  constructor(private readonly dataSource: IPermissionDataSource) {}

  public async check(type: PermissionType): Promise<Permission> {
    const key = PermissionTypeMapper.toNative(type);
    const nativeStatus = await this.dataSource.check(key);
    return this.toPermission(type, key, nativeStatus);
  }

  public async request(type: PermissionType): Promise<Permission> {
    const key = PermissionTypeMapper.toNative(type);
    const nativeStatus = await this.dataSource.request(key);
    return this.toPermission(type, key, nativeStatus);
  }

  public async requestMultiple(types: readonly PermissionType[]): Promise<readonly Permission[]> {
    const keys = types.map(t => PermissionTypeMapper.toNative(t));
    const uniqueKeys = Array.from(new Set(keys));
    const results = await this.dataSource.requestMultiple(uniqueKeys);

    return types.map((type, index) => {
      const key = keys[index]!;
      // When a logical permission maps to a comma-separated group, pick
      // the worst (most restrictive) status among the group members.
      const statuses = key.split(',').map(k => results[k] ?? results[key] ?? 'unavailable');
      const nativeStatus = PermissionRepository.pickWorstStatus(statuses);
      return this.toPermission(type, key, nativeStatus);
    });
  }

  public async shouldShowRationale(type: PermissionType): Promise<boolean> {
    const key = PermissionTypeMapper.toNative(type);
    // For grouped permissions, rationale is true if any member needs it.
    const members = key.split(',');
    for (const member of members) {
      if (await this.dataSource.shouldShowRationale(member)) {
        return true;
      }
    }
    return false;
  }

  public openAppSettings(): Promise<void> {
    return this.dataSource.openAppSettings();
  }

  private toPermission(type: PermissionType, nativeKey: string, nativeStatus: string): Permission {
    const status = PermissionStatusMapper.toDomain(nativeStatus);
    if (status === PermissionStatus.UNAVAILABLE && isAndroid()) {
      PermissionRepository.warnUndeclared(nativeKey);
    }
    return {
      type,
      status,
      canAskAgain: PermissionStatusMapper.canAskAgain(status),
      checkedAt: Date.now(),
    };
  }

  /** Warn once when Android says UNAVAILABLE (usually missing manifest entry). */
  private static warnUndeclared(nativeKey: string): void {
    const keys = nativeKey
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);
    const cacheKey = keys.join(',');
    if (keys.length === 0 || PermissionRepository.warnedUndeclared.has(cacheKey)) {
      return;
    }
    PermissionRepository.warnedUndeclared.add(cacheKey);

    const shortNames = keys.map(k => (k.includes('.') ? k.slice(k.lastIndexOf('.') + 1) : k));
    const message =
      shortNames.length === 1
        ? `${shortNames[0]} not declared in AndroidManifest.xml`
        : `${shortNames.join(', ')} — at least one is not declared in AndroidManifest.xml`;

    console.warn(`[PermissionManager] ${message}`);
    Logger.warn(message);
  }

  private static pickWorstStatus(statuses: string[]): string {
    const order = ['unavailable', 'blocked', 'denied', 'not_determined', 'limited', 'granted'];
    let worst = statuses[0] ?? 'unavailable';
    let worstRank = order.indexOf(worst);
    if (worstRank < 0) {
      worstRank = 0;
    }
    for (const status of statuses) {
      const rank = order.indexOf(status);
      if (rank >= 0 && rank < worstRank) {
        worst = status;
        worstRank = rank;
      }
    }
    return worst;
  }
}
