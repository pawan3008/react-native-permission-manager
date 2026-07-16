/**
 * Domain entity: the normalized, platform-agnostic status of a permission.
 */
export enum PermissionStatus {
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  BLOCKED = 'BLOCKED',
  LIMITED = 'LIMITED',
  UNAVAILABLE = 'UNAVAILABLE',
  NOT_DETERMINED = 'NOT_DETERMINED',
}
