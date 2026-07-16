import { PermissionManager } from '../../src/presentation/PermissionManager';
import { PermissionManagerContainer } from '../../src/di/container';
import { PermissionType } from '../../src/domain/entities/PermissionType';
import { PermissionStatus } from '../../src/domain/entities/PermissionStatus';
import { PermissionRepository } from '../../src/data/repositories/PermissionRepository';
import {
  CheckPermissionUseCase,
  RequestPermissionUseCase,
  RequestMultiplePermissionsUseCase,
  OpenAppSettingsUseCase,
  ShouldShowRationaleUseCase,
  EnsurePermissionUseCase,
} from '../../src/domain/usecases';
import { createFakeDataSource } from '../__mocks__/NativePermissionManager.mock';
import { Alert } from 'react-native';

describe('PermissionManager', () => {
  beforeEach(() => {
    PermissionManagerContainer.reset();
    PermissionManager.clearCache();

    const dataSource = createFakeDataSource({
      'android.permission.CAMERA': 'denied',
      'android.permission.RECORD_AUDIO': 'granted',
    });
    const repository = new PermissionRepository(dataSource);

    PermissionManagerContainer.override({
      dataSource,
      repository,
      checkPermissionUseCase: new CheckPermissionUseCase(repository),
      requestPermissionUseCase: new RequestPermissionUseCase(repository),
      requestMultiplePermissionsUseCase: new RequestMultiplePermissionsUseCase(repository),
      openAppSettingsUseCase: new OpenAppSettingsUseCase(repository),
      shouldShowRationaleUseCase: new ShouldShowRationaleUseCase(repository),
      ensurePermissionUseCase: new EnsurePermissionUseCase(repository),
    });
  });

  afterEach(() => {
    PermissionManagerContainer.reset();
    PermissionManager.clearCache();
  });

  it('check() returns a typed PermissionResult', async () => {
    const result = await PermissionManager.check('camera');

    expect(result.type).toBe(PermissionType.CAMERA);
    expect(result.status).toBe(PermissionStatus.DENIED);
  });

  it('request() grants permission via the repository', async () => {
    const result = await PermissionManager.request(PermissionType.CAMERA, {
      showRationale: false,
    });

    expect(result.status).toBe(PermissionStatus.GRANTED);
  });

  it('addListener is notified on status changes', async () => {
    const listener = jest.fn();
    const unsubscribe = PermissionManager.addListener(listener);

    await PermissionManager.request('camera', { showRationale: false });

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });

  it('openSettings() resolves', async () => {
    await expect(PermissionManager.openSettings()).resolves.toBeUndefined();
  });

  it('checkGroup() resolves a built-in group and reports partial grants', async () => {
    const group = await PermissionManager.checkGroup('media');

    expect(group.group).toBe('media');
    expect(group.results).toHaveLength(3);
    expect(group.anyGranted).toBe(true); // microphone starts granted
    expect(group.allGranted).toBe(false); // camera starts denied
  });

  it('requestGroup() requests every permission and reports allGranted', async () => {
    const group = await PermissionManager.requestGroup('media', { showRationale: false });

    expect(group.allGranted).toBe(true);
    expect(group.results.every(r => r.status === PermissionStatus.GRANTED)).toBe(true);
  });

  it('checkGroup() accepts an ad-hoc list with an undefined group name', async () => {
    const group = await PermissionManager.checkGroup(['camera', 'microphone']);

    expect(group.group).toBeUndefined();
    expect(group.results).toHaveLength(2);
  });

  it('request() does NOT show the rationale dialog just because title/message are passed', async () => {
    // Notification has never been requested/denied, so Android's
    // shouldShowRequestPermissionRationale would report false here.
    const dataSource = createFakeDataSource({
      'android.permission.POST_NOTIFICATIONS': 'not_determined',
    });
    const repository = new PermissionRepository(dataSource);
    PermissionManagerContainer.override({
      dataSource,
      repository,
      checkPermissionUseCase: new CheckPermissionUseCase(repository),
      requestPermissionUseCase: new RequestPermissionUseCase(repository),
      requestMultiplePermissionsUseCase: new RequestMultiplePermissionsUseCase(repository),
      openAppSettingsUseCase: new OpenAppSettingsUseCase(repository),
      shouldShowRationaleUseCase: new ShouldShowRationaleUseCase(repository),
      ensurePermissionUseCase: new EnsurePermissionUseCase(repository),
    });

    (Alert.alert as jest.Mock).mockClear();

    const result = await PermissionManager.request('notification', {
      title: 'Notifications',
      message: 'Enable notifications to get updates.',
    });

    expect(Alert.alert).not.toHaveBeenCalled();
    expect(result.status).toBe(PermissionStatus.GRANTED);
  });

  it('request() DOES show the rationale dialog when Android recommends it, using title/message as content', async () => {
    // Default beforeEach seeds camera as 'denied', which the fake data
    // source's shouldShowRationale treats as "should show".
    (Alert.alert as jest.Mock).mockClear();
    (Alert.alert as jest.Mock).mockImplementation((_title, _message, buttons) => {
      // simulate user tapping the confirm (non-cancel) button
      const confirmButton = buttons?.find((b: { style?: string }) => b.style !== 'cancel');
      confirmButton?.onPress?.();
    });

    const result = await PermissionManager.request('camera', {
      title: 'Camera',
      message: 'Needed for profile photo',
    });

    expect(Alert.alert).toHaveBeenCalledTimes(1);
    expect(Alert.alert).toHaveBeenCalledWith(
      'Camera',
      'Needed for profile photo',
      expect.anything(),
      expect.anything(),
    );
    expect(result.status).toBe(PermissionStatus.GRANTED);
  });
});
