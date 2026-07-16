/**
 * Thin wrapper around the native module. Speaks native permission keys / status strings.
 */
export interface IPermissionDataSource {
  check(nativePermissionKey: string): Promise<string>;
  request(nativePermissionKey: string): Promise<string>;
  requestMultiple(nativePermissionKeys: string[]): Promise<Record<string, string>>;
  shouldShowRationale(nativePermissionKey: string): Promise<boolean>;
  openAppSettings(): Promise<void>;
}
