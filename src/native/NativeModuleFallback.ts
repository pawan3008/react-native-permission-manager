import { NativeModules, TurboModuleRegistry } from 'react-native';
import type { Spec } from './NativePermissionManager';

const MODULE_NAME = 'RNPermissionManagerSpec';

let hasWarnedMissingModule = false;

/**
 * Resolves the native permission module via TurboModules first, then
 * falls back to the classic `NativeModules` bridge.
 *
 * If neither is linked (forgot rebuild / pod install / autolinking miss),
 * returns a stub that resolves every call to `unavailable` and warns once —
 * never hard-throws, so a link miss cannot crash the JS app.
 */
export function getPermissionManagerModule(): Spec {
  const turbo = TurboModuleRegistry.get<Spec>(MODULE_NAME);
  if (turbo != null) {
    return turbo;
  }

  const legacy = NativeModules[MODULE_NAME] as Spec | undefined;
  if (legacy != null) {
    return legacy;
  }

  warnMissingModuleOnce();
  return createUnlinkedStub();
}

function warnMissingModuleOnce(): void {
  if (hasWarnedMissingModule) {
    return;
  }
  hasWarnedMissingModule = true;
  const message =
    `[PermissionManager] Native module "${MODULE_NAME}" is not linked. ` +
    'Returning UNAVAILABLE for all calls. Rebuild the native app after install ' +
    '(iOS: `cd ios && pod install`, then clean rebuild).';
  // Always surface — this is a host-app setup mistake.

  console.warn(message);
}

/** Stub Spec used when the native binary is missing. */
function createUnlinkedStub(): Spec {
  return {
    check: async (_permission: string) => {
      warnMissingModuleOnce();
      return 'unavailable';
    },
    request: async (_permission: string) => {
      warnMissingModuleOnce();
      return 'unavailable';
    },
    requestMultiple: async (permissions: string[]) => {
      warnMissingModuleOnce();
      const result: { [permission: string]: string } = {};
      for (const permission of permissions) {
        result[permission] = 'unavailable';
      }
      return result;
    },
    shouldShowRequestPermissionRationale: async (_permission: string) => false,
    openSettings: async () => {
      warnMissingModuleOnce();
    },
  } as Spec;
}

/** @internal — test helper to reset the once-warning latch. */
export function __resetMissingModuleWarningForTests(): void {
  hasWarnedMissingModule = false;
}
