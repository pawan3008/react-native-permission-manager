import type { PermissionInput } from './permissions';

/**
 * Built-in, named collections of related permissions. Request or check an
 * entire group with one call instead of hand-listing individual permissions.
 */
export const PERMISSION_GROUPS = {
  /** Camera, microphone, and photo library — typical media-capture flows. */
  media: ['camera', 'microphone', 'photos'],
  /** Foreground + background location. */
  location: ['location', 'locationBackground'],
  /** Contacts and calendar — typical "connect your account" flows. */
  contactsAndCalendar: ['contacts', 'calendar'],
  /** SMS, phone calls, and contacts — typical communication-app flows. */
  communication: ['sms', 'callPhone', 'contacts'],
  /** Notifications and bluetooth — typical companion-device flows. */
  connectivity: ['notification', 'bluetooth'],
} as const satisfies Record<string, readonly PermissionInput[]>;

/** Name of a built-in permission group. */
export type PermissionGroupName = keyof typeof PERMISSION_GROUPS;

/** Accepts either a built-in group name or an ad-hoc list of permissions. */
export type PermissionGroupInput = PermissionGroupName | readonly PermissionInput[];

/** Resolves a {@link PermissionGroupInput} to a flat list of permission inputs. */
export function resolvePermissionGroup(input: PermissionGroupInput): readonly PermissionInput[] {
  if (typeof input === 'string' && input in PERMISSION_GROUPS) {
    return PERMISSION_GROUPS[input as PermissionGroupName];
  }
  return input as readonly PermissionInput[];
}
