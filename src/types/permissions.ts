import { PermissionStatus } from '../domain/entities/PermissionStatus';
import type { PermissionResult } from './PermissionResult';
import { PermissionType } from '../domain/entities/PermissionType';

/**
 * Consumer-friendly permission names (stable string literals).
 * These alias the internal `PermissionType` enum for a simpler public API.
 */
export type PermissionName =
  | 'camera'
  | 'microphone'
  | 'photos'
  | 'notification'
  | 'contacts'
  | 'location'
  | 'calendar'
  | 'bluetooth'
  | 'storage'
  | 'locationBackground'
  | 'sms'
  | 'callPhone';

/** Any permission identifier accepted by the public API. */
export type PermissionInput = PermissionName | PermissionType;

/** Options accepted by `request` / `ensure` / hooks / PermissionGate. */
export interface PermissionOptions {
  /** Dialog title shown before the system prompt (Android rationale / pre-prompt). */
  title?: string;
  /** Dialog body shown before the system prompt. */
  message?: string;
  /** Positive button label. Defaults to "Continue" / localized. */
  confirmLabel?: string;
  /** Negative button label. Defaults to "Cancel" / localized. */
  cancelLabel?: string;
  /** Automatically show a rationale dialog when Android recommends it. */
  showRationale?: boolean;
  /** When permanently denied (blocked), open app settings and re-check. */
  redirectToSettingsOnBlocked?: boolean;
  /** Title for the "open settings" dialog when permanently denied. */
  settingsTitle?: string;
  /** Message for the "open settings" dialog when permanently denied. */
  settingsMessage?: string;
  /** Custom rationale UI — return `true` to continue, `false` to abort. */
  renderRationale?: (args: {
    permission: PermissionType;
    title: string;
    message: string;
  }) => Promise<boolean>;
  /** Custom settings-redirect UI — return `true` to open settings. */
  renderSettingsPrompt?: (args: {
    permission: PermissionType;
    title: string;
    message: string;
  }) => Promise<boolean>;
}

/**
 * @deprecated Prefer {@link PermissionOptions}. Kept for backwards compatibility.
 */
export type PermissionConfig = PermissionOptions;

/** Listener invoked whenever a tracked permission status changes. */
export type PermissionListener = (result: PermissionResult) => void | Promise<void>;

/** Unsubscribe handle returned by `addListener`. */
export type PermissionUnsubscribe = () => void;

/** Map of PermissionName → PermissionType for convenient lookups. */
export const PERMISSION_NAME_MAP: Record<PermissionName, PermissionType> = {
  camera: PermissionType.CAMERA,
  microphone: PermissionType.MICROPHONE,
  photos: PermissionType.PHOTO_LIBRARY,
  notification: PermissionType.NOTIFICATIONS,
  contacts: PermissionType.CONTACTS,
  location: PermissionType.LOCATION_FOREGROUND,
  calendar: PermissionType.CALENDAR,
  bluetooth: PermissionType.BLUETOOTH,
  storage: PermissionType.STORAGE,
  locationBackground: PermissionType.LOCATION_BACKGROUND,
  sms: PermissionType.SMS,
  callPhone: PermissionType.CALL_PHONE,
};

export function resolvePermissionType(input: PermissionInput): PermissionType {
  if (typeof input === 'string' && input in PERMISSION_NAME_MAP) {
    return PERMISSION_NAME_MAP[input as PermissionName];
  }
  return input as PermissionType;
}

export function isGrantedStatus(status: PermissionStatus): boolean {
  return status === PermissionStatus.GRANTED || status === PermissionStatus.LIMITED;
}
