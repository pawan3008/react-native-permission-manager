import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { PermissionGroupResult } from '../../types/PermissionGroupResult';
import type { PermissionGroupInput } from '../../types/permissionGroups';
import { resolvePermissionGroup } from '../../types/permissionGroups';
import type { PermissionOptions } from '../../types/permissions';
import { PermissionManager } from '../PermissionManager';

export interface UsePermissionGroupReturn {
  /** Per-permission results, in group order. */
  results: PermissionGroupResult['results'];
  /** `true` only if every permission in the group is granted (or limited). */
  allGranted: boolean;
  /** `true` if at least one permission in the group is granted (or limited). */
  anyGranted: boolean;
  loading: boolean;
  error: Error | undefined;
  check: () => Promise<PermissionGroupResult>;
  request: (options?: PermissionOptions) => Promise<PermissionGroupResult>;
}

/**
 * Hook for a named permission group (e.g. `'media'`) or an ad-hoc list.
 * Mirrors `usePermission`, but operates on the whole group at once and
 * automatically refreshes when the app returns from Settings.
 */
export function usePermissionGroup(group: PermissionGroupInput): UsePermissionGroupReturn {
  const permissions = resolvePermissionGroup(group);
  const groupName = typeof group === 'string' ? group : undefined;

  const [state, setState] = useState<PermissionGroupResult>({
    group: groupName,
    results: [],
    allGranted: false,
    anyGranted: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const next = await PermissionManager.checkGroup(permissions);
      setState({ ...next, group: groupName });
      setError(undefined);
      return next;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [groupName, permissions]);

  const request = useCallback(
    async (options?: PermissionOptions) => {
      setLoading(true);
      try {
        const next = await PermissionManager.requestGroup(permissions, options);
        setState({ ...next, group: groupName });
        setError(undefined);
        return next;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [groupName, permissions],
  );

  useEffect(() => {
    void check();
  }, [check]);

  // Auto-refresh when the app returns from Settings / background.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void check();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [check]);

  return {
    results: state.results,
    allGranted: state.allGranted,
    anyGranted: state.anyGranted,
    loading,
    error,
    check,
    request,
  };
}
