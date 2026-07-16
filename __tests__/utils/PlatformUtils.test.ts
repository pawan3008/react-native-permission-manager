import { resolvePermissionType, PERMISSION_NAME_MAP } from '../../src/types/permissions';
import { PermissionType } from '../../src/domain/entities/PermissionType';
import { getAndroidApiLevel, isAndroid, isIOS } from '../../src/utils/PlatformUtils';
import { invariant } from '../../src/utils/invariant';

describe('PlatformUtils', () => {
  it('detects Android from global mock', () => {
    // setup.ts mocks Platform.OS as android
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
    expect(getAndroidApiLevel()).toBe(34);
  });
});

describe('resolvePermissionType', () => {
  it('maps friendly names', () => {
    expect(resolvePermissionType('camera')).toBe(PermissionType.CAMERA);
    expect(PERMISSION_NAME_MAP.photos).toBe(PermissionType.PHOTO_LIBRARY);
  });

  it('passes through enums', () => {
    expect(resolvePermissionType(PermissionType.CONTACTS)).toBe(PermissionType.CONTACTS);
  });
});

describe('invariant', () => {
  it('throws when condition is falsy', () => {
    expect(() => invariant(false, 'boom')).toThrow('[PermissionManager] boom');
  });

  it('does not throw when condition is truthy', () => {
    expect(() => invariant(true, 'ok')).not.toThrow();
  });
});
