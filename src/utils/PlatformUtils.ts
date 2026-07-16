import { Platform } from 'react-native';

export type SupportedPlatform = 'ios' | 'android';

export function getSupportedPlatform(): SupportedPlatform | null {
  if (Platform.OS === 'ios') {
    return 'ios';
  }
  if (Platform.OS === 'android') {
    return 'android';
  }
  return null;
}

export function isAndroid(): boolean {
  return Platform.OS === 'android';
}

export function isIOS(): boolean {
  return Platform.OS === 'ios';
}

export function getAndroidApiLevel(): number {
  if (Platform.OS !== 'android') {
    return 0;
  }
  return typeof Platform.Version === 'number'
    ? Platform.Version
    : parseInt(String(Platform.Version), 10) || 0;
}
