import { RequestPermissionUseCase } from '../../../src/domain/usecases/RequestPermissionUseCase';
import { EnsurePermissionUseCase } from '../../../src/domain/usecases/EnsurePermissionUseCase';
import { PermissionType } from '../../../src/domain/entities/PermissionType';
import { PermissionStatus } from '../../../src/domain/entities/PermissionStatus';
import type { IPermissionRepository } from '../../../src/domain/repositories/IPermissionRepository';
import type { Permission } from '../../../src/domain/entities/Permission';

function fakeRepo(overrides: Partial<IPermissionRepository> = {}): IPermissionRepository {
  return {
    check: jest.fn(),
    request: jest.fn(),
    requestMultiple: jest.fn(),
    shouldShowRationale: jest.fn(),
    openAppSettings: jest.fn(),
    ...overrides,
  };
}

describe('RequestPermissionUseCase', () => {
  it('delegates to repository.request', async () => {
    const permission: Permission = {
      type: PermissionType.CAMERA,
      status: PermissionStatus.GRANTED,
      canAskAgain: false,
      checkedAt: 1,
    };
    const repository = fakeRepo({
      request: jest.fn().mockResolvedValue(permission),
    });

    const result = await new RequestPermissionUseCase(repository).execute(PermissionType.CAMERA);

    expect(repository.request).toHaveBeenCalledWith(PermissionType.CAMERA);
    expect(result.status).toBe(PermissionStatus.GRANTED);
  });
});

describe('EnsurePermissionUseCase', () => {
  it('returns early when already granted', async () => {
    const granted: Permission = {
      type: PermissionType.CAMERA,
      status: PermissionStatus.GRANTED,
      canAskAgain: false,
      checkedAt: 1,
    };
    const repository = fakeRepo({
      check: jest.fn().mockResolvedValue(granted),
      request: jest.fn(),
    });

    const result = await new EnsurePermissionUseCase(repository).execute({
      type: PermissionType.CAMERA,
    });

    expect(result.status).toBe(PermissionStatus.GRANTED);
    expect(repository.request).not.toHaveBeenCalled();
  });

  it('requests when denied, then opens settings when blocked', async () => {
    const denied: Permission = {
      type: PermissionType.CAMERA,
      status: PermissionStatus.DENIED,
      canAskAgain: true,
      checkedAt: 1,
    };
    const blocked: Permission = {
      ...denied,
      status: PermissionStatus.BLOCKED,
      canAskAgain: false,
    };
    const afterSettings: Permission = {
      ...denied,
      status: PermissionStatus.GRANTED,
      canAskAgain: false,
    };

    const repository = fakeRepo({
      check: jest.fn().mockResolvedValueOnce(denied).mockResolvedValueOnce(afterSettings),
      request: jest.fn().mockResolvedValue(blocked),
      openAppSettings: jest.fn().mockResolvedValue(undefined),
    });

    const onBlocked = jest.fn().mockResolvedValue(true);

    const result = await new EnsurePermissionUseCase(repository).execute({
      type: PermissionType.CAMERA,
      onBlocked,
    });

    expect(repository.request).toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalled();
    expect(repository.openAppSettings).toHaveBeenCalled();
    expect(result.status).toBe(PermissionStatus.GRANTED);
  });
});
