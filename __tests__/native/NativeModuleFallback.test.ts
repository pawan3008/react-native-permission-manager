import {
  __resetMissingModuleWarningForTests,
  getPermissionManagerModule,
} from '../../src/native/NativeModuleFallback';

jest.mock('react-native', () => ({
  NativeModules: {},
  TurboModuleRegistry: {
    get: () => null,
  },
}));

describe('NativeModuleFallback — missing native module', () => {
  beforeEach(() => {
    __resetMissingModuleWarningForTests();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not throw when the native module is unlinked', () => {
    expect(() => getPermissionManagerModule()).not.toThrow();
  });

  it('warns once and resolves check/request to unavailable', async () => {
    const module = getPermissionManagerModule();

    await expect(module.check('android.permission.CAMERA')).resolves.toBe('unavailable');
    await expect(module.request('android.permission.CAMERA')).resolves.toBe('unavailable');
    await expect(module.requestMultiple(['android.permission.CAMERA'])).resolves.toEqual({
      'android.permission.CAMERA': 'unavailable',
    });
    await expect(
      module.shouldShowRequestPermissionRationale('android.permission.CAMERA'),
    ).resolves.toBe(false);
    await expect(module.openSettings()).resolves.toBeUndefined();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Native module "RNPermissionManagerSpec" is not linked'),
    );
  });
});
