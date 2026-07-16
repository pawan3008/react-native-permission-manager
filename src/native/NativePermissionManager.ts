import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Codegen TurboModule specification.
 *
 * This file is the single source of truth consumed by React Native's
 * codegen to generate the native (Java/Kotlin + Obj-C++) glue code for both
 * the New Architecture (TurboModules) and, via the interop layer, the
 * legacy bridge.
 *
 * IMPORTANT (architecture-only constraint):
 * - Method signatures use only codegen-compatible types (primitives,
 *   arrays, and plain object literals) — no domain entities/enums leak here.
 * - This file must not contain any business logic; it only defines the
 *   native contract. Translation to/from domain types happens in
 *   `src/data/mappers` and `src/data/datasources`.
 */
export interface Spec extends TurboModule {
  /** Returns the raw native permission status string for a given native permission key. */
  check(permission: string): Promise<string>;

  /** Prompts the user for a single native permission key, returns the resulting status. */
  request(permission: string): Promise<string>;

  /** Prompts the user for multiple native permission keys in one native call. */
  requestMultiple(permissions: string[]): Promise<{ [permission: string]: string }>;

  /** Mirrors Android's shouldShowRequestPermissionRationale; false/no-op on platforms without it. */
  shouldShowRequestPermissionRationale(permission: string): Promise<boolean>;

  /** Opens the OS-level app settings screen. */
  openSettings(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('RNPermissionManagerSpec');
