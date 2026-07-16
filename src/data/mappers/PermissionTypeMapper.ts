import { Platform } from 'react-native';
import { PermissionType } from '../../domain/entities/PermissionType';
import { PermissionOperationError } from '../../domain/errors/PermissionOperationError';
import { getAndroidApiLevel } from '../../utils/PlatformUtils';

/**
 * Maps domain `PermissionType` values to native permission keys understood
 * by the Android / iOS native modules.
 */
export class PermissionTypeMapper {
  public static toNative(type: PermissionType): string {
    if (Platform.OS === 'android') {
      return PermissionTypeMapper.toAndroid(type);
    }
    if (Platform.OS === 'ios') {
      return PermissionTypeMapper.toIOS(type);
    }
    throw new PermissionOperationError(`Unsupported platform: ${Platform.OS}`);
  }

  public static toAndroid(type: PermissionType): string {
    const api = getAndroidApiLevel();

    switch (type) {
      case PermissionType.CAMERA:
        return 'android.permission.CAMERA';
      case PermissionType.MICROPHONE:
        return 'android.permission.RECORD_AUDIO';
      case PermissionType.LOCATION_FOREGROUND:
        return [
          'android.permission.ACCESS_FINE_LOCATION',
          'android.permission.ACCESS_COARSE_LOCATION',
        ].join(',');
      case PermissionType.LOCATION_BACKGROUND:
        return 'android.permission.ACCESS_BACKGROUND_LOCATION';
      case PermissionType.PHOTO_LIBRARY:
        if (api >= 33) {
          return [
            'android.permission.READ_MEDIA_IMAGES',
            'android.permission.READ_MEDIA_VIDEO',
          ].join(',');
        }
        return 'android.permission.READ_EXTERNAL_STORAGE';
      case PermissionType.STORAGE:
        if (api >= 33) {
          return [
            'android.permission.READ_MEDIA_IMAGES',
            'android.permission.READ_MEDIA_VIDEO',
            'android.permission.READ_MEDIA_AUDIO',
          ].join(',');
        }
        if (api >= 29) {
          return 'android.permission.READ_EXTERNAL_STORAGE';
        }
        return [
          'android.permission.READ_EXTERNAL_STORAGE',
          'android.permission.WRITE_EXTERNAL_STORAGE',
        ].join(',');
      case PermissionType.NOTIFICATIONS:
        return 'android.permission.POST_NOTIFICATIONS';
      case PermissionType.CONTACTS:
        return 'android.permission.READ_CONTACTS';
      case PermissionType.CALENDAR:
        return ['android.permission.READ_CALENDAR', 'android.permission.WRITE_CALENDAR'].join(',');
      case PermissionType.BLUETOOTH:
        if (api >= 31) {
          return ['android.permission.BLUETOOTH_SCAN', 'android.permission.BLUETOOTH_CONNECT'].join(
            ',',
          );
        }
        return 'android.permission.ACCESS_FINE_LOCATION';
      case PermissionType.SMS:
        return 'android.permission.READ_SMS';
      case PermissionType.CALL_PHONE:
        return 'android.permission.CALL_PHONE';
      default:
        throw new PermissionOperationError(`Unsupported permission type: ${type}`);
    }
  }

  public static toIOS(type: PermissionType): string {
    switch (type) {
      case PermissionType.CAMERA:
        return 'ios.permission.CAMERA';
      case PermissionType.MICROPHONE:
        return 'ios.permission.MICROPHONE';
      case PermissionType.PHOTO_LIBRARY:
        return 'ios.permission.PHOTO_LIBRARY';
      case PermissionType.CONTACTS:
        return 'ios.permission.CONTACTS';
      case PermissionType.LOCATION_FOREGROUND:
        return 'ios.permission.LOCATION_WHEN_IN_USE';
      case PermissionType.LOCATION_BACKGROUND:
        return 'ios.permission.LOCATION_ALWAYS';
      case PermissionType.NOTIFICATIONS:
        return 'ios.permission.NOTIFICATIONS';
      case PermissionType.CALENDAR:
        return 'ios.permission.CALENDAR';
      case PermissionType.BLUETOOTH:
        return 'ios.permission.BLUETOOTH';
      case PermissionType.STORAGE:
        return 'ios.permission.PHOTO_LIBRARY';
      case PermissionType.SMS:
      case PermissionType.CALL_PHONE:
        return 'ios.permission.UNAVAILABLE';
      default:
        throw new PermissionOperationError(`Unsupported permission type: ${type}`);
    }
  }
}
