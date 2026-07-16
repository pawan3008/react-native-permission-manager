import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * TurboModule / bridge contract. Keep types codegen-friendly
 * (strings, arrays, plain objects) — no domain enums here.
 */
export interface Spec extends TurboModule {
  check(permission: string): Promise<string>;
  request(permission: string): Promise<string>;
  requestMultiple(permissions: string[]): Promise<{ [permission: string]: string }>;
  shouldShowRequestPermissionRationale(permission: string): Promise<boolean>;
  openSettings(): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('RNPermissionManagerSpec');
