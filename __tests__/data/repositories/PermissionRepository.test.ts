import { PermissionType } from '../../../src/domain/entities/PermissionType';
import { PermissionStatus } from '../../../src/domain/entities/PermissionStatus';
import { PermissionRepository } from '../../../src/data/repositories/PermissionRepository';
import { createFakeDataSource } from '../../__mocks__/NativePermissionManager.mock';

jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 34 },
}));

describe('PermissionRepository', () => {
  it('checks a permission and maps granted status', async () => {
    const ds = createFakeDataSource({
      'android.permission.CAMERA': 'granted',
    });
    const repo = new PermissionRepository(ds);

    const result = await repo.check(PermissionType.CAMERA);

    expect(result.type).toBe(PermissionType.CAMERA);
    expect(result.status).toBe(PermissionStatus.GRANTED);
    expect(result.canAskAgain).toBe(false);
  });

  it('requests a permission and updates status', async () => {
    const ds = createFakeDataSource({
      'android.permission.CAMERA': 'denied',
    });
    const repo = new PermissionRepository(ds);

    const result = await repo.request(PermissionType.CAMERA);

    expect(result.status).toBe(PermissionStatus.GRANTED);
    expect(ds.store['android.permission.CAMERA']).toBe('granted');
  });

  it('maps blocked to canAskAgain=false', async () => {
    const ds = createFakeDataSource({
      'android.permission.RECORD_AUDIO': 'blocked',
    });
    const repo = new PermissionRepository(ds);

    const result = await repo.check(PermissionType.MICROPHONE);

    expect(result.status).toBe(PermissionStatus.BLOCKED);
    expect(result.canAskAgain).toBe(false);
  });

  it('warns clearly when Android returns UNAVAILABLE (undeclared manifest permission)', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ds = createFakeDataSource({
      'android.permission.CAMERA': 'unavailable',
    });
    const repo = new PermissionRepository(ds);

    const result = await repo.check(PermissionType.CAMERA);

    expect(result.status).toBe(PermissionStatus.UNAVAILABLE);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('CAMERA not declared in AndroidManifest.xml'),
    );
    warnSpy.mockRestore();
  });
});
