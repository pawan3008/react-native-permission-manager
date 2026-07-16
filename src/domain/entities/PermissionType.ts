/**
 * Domain entity: the exhaustive set of permission types supported by the library.
 * Platform-specific mapping happens in the data layer (see data/mappers).
 */
export enum PermissionType {
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE',
  LOCATION_FOREGROUND = 'LOCATION_FOREGROUND',
  LOCATION_BACKGROUND = 'LOCATION_BACKGROUND',
  PHOTO_LIBRARY = 'PHOTO_LIBRARY',
  CONTACTS = 'CONTACTS',
  CALENDAR = 'CALENDAR',
  NOTIFICATIONS = 'NOTIFICATIONS',
  BLUETOOTH = 'BLUETOOTH',
  STORAGE = 'STORAGE',
  SMS = 'SMS',
  CALL_PHONE = 'CALL_PHONE',
}
