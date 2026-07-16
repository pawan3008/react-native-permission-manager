/**
 * Data-layer abstraction over the raw native bridge, decoupled from any
 * particular native transport (TurboModule vs legacy NativeModules).
 *
 * Operates on raw native string keys/results (not domain enums) — mapping
 * to/from domain types happens in `src/data/mappers` and is orchestrated
 * by `src/data/repositories/PermissionRepository`.
 */
export interface IPermissionDataSource {
  check(nativePermissionKey: string): Promise<string>;
  request(nativePermissionKey: string): Promise<string>;
  requestMultiple(nativePermissionKeys: string[]): Promise<Record<string, string>>;
  shouldShowRationale(nativePermissionKey: string): Promise<boolean>;
  openAppSettings(): Promise<void>;
}
