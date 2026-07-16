import { usePermission } from '../../../src/presentation/hooks/usePermission';

describe('usePermission', () => {
  it('is exported as a function', () => {
    expect(typeof usePermission).toBe('function');
  });
});
