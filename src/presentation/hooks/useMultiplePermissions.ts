import { useCallback, useEffect, useState } from 'react';
import type { PermissionResult } from '../../types/PermissionResult';
import type { PermissionOptions } from '../../types/permissions';
import type { PermissionGroupInput } from '../../types/permissionGroups';
import { resolvePermissionGroup } from '../../types/permissionGroups';
import { PermissionManager } from '../PermissionManager';

export interface UseMultiplePermissionsReturn {
  results: readonly PermissionResult[];
  loading: boolean;
  error: Error | undefined;
  check: () => Promise<readonly PermissionResult[]>;
  request: (options?: PermissionOptions) => Promise<readonly PermissionResult[]>;
}

/**
 * Hook for checking / requesting several permissions together — pass an
 * ad-hoc list (`['camera', 'microphone']`) or a built-in group name
 * (`'media'`). For richer group semantics (`allGranted`/`anyGranted`) prefer
 * {@link usePermissionGroup}.
 */
export function useMultiplePermissions(
  permissionsOrGroup: PermissionGroupInput,
): UseMultiplePermissionsReturn {
  const permissions = resolvePermissionGroup(permissionsOrGroup);
  const [results, setResults] = useState<readonly PermissionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>();

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const next = await Promise.all(permissions.map(p => PermissionManager.check(p)));
      setResults(next);
      setError(undefined);
      return next;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  const request = useCallback(
    async (options?: PermissionOptions) => {
      setLoading(true);
      try {
        const next = await PermissionManager.requestMultiple(permissions, options);
        setResults(next);
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
    [permissions],
  );

  useEffect(() => {
    void check();
  }, [check]);

  return { results, loading, error, check, request };
}
