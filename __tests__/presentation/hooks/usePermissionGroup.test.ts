import { usePermissionGroup } from '../../../src/presentation/hooks/usePermissionGroup';

describe('usePermissionGroup', () => {
  it('is exported as a function', () => {
    expect(typeof usePermissionGroup).toBe('function');
  });
});
