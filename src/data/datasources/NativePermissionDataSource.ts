import type { IPermissionDataSource } from './IPermissionDataSource';
import { getPermissionManagerModule } from '../../native/NativeModuleFallback';
import type { Spec } from '../../native/NativePermissionManager';
import { Logger } from '../../utils/Logger';

/**
 * Talks to the native module. Dedupes in-flight request() calls so a
 * double-tap doesn't fire two system dialogs at once.
 */
export class NativePermissionDataSource implements IPermissionDataSource {
  private readonly module: Spec;

  private readonly inFlightRequests = new Map<string, Promise<string>>();
  private readonly inFlightBatches = new Map<string, Promise<Record<string, string>>>();

  constructor(module: Spec = getPermissionManagerModule()) {
    this.module = module;
  }

  public check(nativePermissionKey: string): Promise<string> {
    Logger.debug(`native.check(${nativePermissionKey})`);
    return this.module.check(nativePermissionKey);
  }

  public request(nativePermissionKey: string): Promise<string> {
    const inFlight = this.inFlightRequests.get(nativePermissionKey);
    if (inFlight != null) {
      Logger.debug(`native.request(${nativePermissionKey}) — coalesced with in-flight call`);
      return inFlight;
    }

    Logger.debug(`native.request(${nativePermissionKey})`);
    const promise = this.module.request(nativePermissionKey).finally(() => {
      this.inFlightRequests.delete(nativePermissionKey);
    });
    this.inFlightRequests.set(nativePermissionKey, promise);
    return promise;
  }

  public requestMultiple(nativePermissionKeys: string[]): Promise<Record<string, string>> {
    const batchKey = [...nativePermissionKeys].sort().join(',');
    const inFlight = this.inFlightBatches.get(batchKey);
    if (inFlight != null) {
      Logger.debug(`native.requestMultiple(${batchKey}) — coalesced with in-flight call`);
      return inFlight;
    }

    Logger.debug(`native.requestMultiple(${nativePermissionKeys.join(',')})`);
    const promise = this.module.requestMultiple(nativePermissionKeys).finally(() => {
      this.inFlightBatches.delete(batchKey);
    });
    this.inFlightBatches.set(batchKey, promise);
    return promise;
  }

  public shouldShowRationale(nativePermissionKey: string): Promise<boolean> {
    return this.module.shouldShowRequestPermissionRationale(nativePermissionKey);
  }

  public openAppSettings(): Promise<void> {
    Logger.debug('native.openSettings()');
    return this.module.openSettings();
  }
}
