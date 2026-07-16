/** Unified native status strings returned by Android / iOS modules. */
export const NativeStatus = {
  GRANTED: 'granted',
  DENIED: 'denied',
  BLOCKED: 'blocked',
  LIMITED: 'limited',
  UNAVAILABLE: 'unavailable',
  NOT_DETERMINED: 'not_determined',
} as const;

export type NativeStatusValue = (typeof NativeStatus)[keyof typeof NativeStatus];

/** Default copy used by rationale / settings dialogs. */
export const DefaultDialogCopy = {
  rationaleTitle: 'Permission required',
  rationaleMessage:
    'This feature needs your permission to continue. Please allow access on the next prompt.',
  rationaleConfirm: 'Continue',
  rationaleCancel: 'Cancel',
  settingsTitle: 'Permission blocked',
  settingsMessage:
    'This permission was permanently denied. Open Settings to grant access manually.',
  settingsConfirm: 'Open Settings',
  settingsCancel: 'Cancel',
} as const;
