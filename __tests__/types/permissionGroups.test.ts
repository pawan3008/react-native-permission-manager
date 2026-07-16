import { PERMISSION_GROUPS, resolvePermissionGroup } from '../../src/types/permissionGroups';

describe('permissionGroups', () => {
  it('resolves a built-in group name to its permission list', () => {
    expect(resolvePermissionGroup('media')).toEqual(PERMISSION_GROUPS.media);
  });

  it('passes an ad-hoc list through unchanged', () => {
    const list = ['camera', 'location'] as const;
    expect(resolvePermissionGroup(list)).toBe(list);
  });

  it('exposes only known group names', () => {
    expect(Object.keys(PERMISSION_GROUPS)).toEqual([
      'media',
      'location',
      'contactsAndCalendar',
      'communication',
      'connectivity',
    ]);
  });
});
