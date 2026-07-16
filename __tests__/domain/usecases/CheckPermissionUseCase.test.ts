import { CheckPermissionUseCase } from '../../../src/domain/usecases/CheckPermissionUseCase';
import { PermissionType } from '../../../src/domain/entities/PermissionType';
import { PermissionStatus } from '../../../src/domain/entities/PermissionStatus';
import type { IPermissionRepository } from '../../../src/domain/repositories/IPermissionRepository';
import type { Permission } from '../../../src/domain/entities/Permission';

describe('CheckPermissionUseCase', () => {
  it('delegates to the repository', async () => {
    const permission: Permission = {
      type: PermissionType.CAMERA,
      status: PermissionStatus.GRANTED,
      canAskAgain: false,
      checkedAt: Date.now(),
    };
    const repository: IPermissionRepository = {
      check: jest.fn().mockResolvedValue(permission),
      request: jest.fn(),
      requestMultiple: jest.fn(),
      shouldShowRationale: jest.fn(),
      openAppSettings: jest.fn(),
    };

    const useCase = new CheckPermissionUseCase(repository);
    const result = await useCase.execute(PermissionType.CAMERA);

    expect(repository.check).toHaveBeenCalledWith(PermissionType.CAMERA);
    expect(result).toEqual(permission);
  });
});
