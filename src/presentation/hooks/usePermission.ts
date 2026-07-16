import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { PermissionStatus } from '../../domain/entities/PermissionStatus';
import type { PermissionResult } from '../../types/PermissionResult';
import type { PermissionInput, PermissionOptions } from '../../types/permissions';
import { isGrantedStatus, resolvePermissionType } from '../../types/permissions';
import { PermissionManager } from '../PermissionManager';
import { usePermissionContext } from '../providers/PermissionProvider';

export interface UsePermissionReturn {
  status: PermissionStatus | undefined;
  result: PermissionResult | undefined;
  loading: boolean;
  /** @deprecated Prefer `loading`. */
  isLoading: boolean;
  granted: boolean;
  error: Error | undefined;
  check: () => Promise<PermissionResult>;
  request: (options?: PermissionOptions) => Promise<PermissionResult>;
  ensure: (options?: PermissionOptions) => Promise<PermissionResult>;
  openSettings: () => Promise<void>;
}

/**
 * Hook: manages a single permission lifecycle with automatic refresh when
 * the app returns from Settings / background.
 */
export function usePermission(
  permission: PermissionInput,
  config?: PermissionOptions,
): UsePermissionReturn {
  const type = resolvePermissionType(permission);
  const ctx = usePermissionContext();
  const cached = ctx?.get(type) ?? PermissionManager.getCached(type);

  const [result, setResult] = useState<PermissionResult | undefined>(cached);
  const [loading, setLoading] = useState(cached == null);
  const [error, setError] = useState<Error | undefined>();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const apply = useCallback((next: PermissionResult) => {
    if (!mounted.current) {
      return;
    }
    setResult(next);
    setError(undefined);
    setLoading(false);
  }, []);

  const check = useCallback(async () => {
    setLoading(true);
    try {
      const next = await PermissionManager.check(type);
      apply(next);
      return next;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      if (mounted.current) {
        setError(e);
        setLoading(false);
      }
      throw e;
    }
  }, [apply, type]);

  const request = useCallback(
    async (options?: PermissionOptions) => {
      setLoading(true);
      try {
        const next = await PermissionManager.request(type, {
          ...config,
          ...options,
        });
        apply(next);
        return next;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mounted.current) {
          setError(e);
          setLoading(false);
        }
        throw e;
      }
    },
    [apply, config, type],
  );

  const ensure = useCallback(
    async (options?: PermissionOptions) => {
      setLoading(true);
      try {
        const next = await PermissionManager.ensure(type, {
          ...config,
          ...options,
        });
        apply(next);
        return next;
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        if (mounted.current) {
          setError(e);
          setLoading(false);
        }
        throw e;
      }
    },
    [apply, config, type],
  );

  const openSettings = useCallback(() => PermissionManager.openSettings(), []);

  // Initial check
  useEffect(() => {
    void check();
  }, [check]);

  // Sync from PermissionManager listeners (Provider + standalone)
  useEffect(() => {
    return PermissionManager.addListener(next => {
      if (next.type === type) {
        apply(next);
      }
    });
  }, [apply, type]);

  // Refresh when returning from Settings even without Provider
  useEffect(() => {
    if (ctx != null) {
      return;
    }
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void check();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [check, ctx]);

  const status = result?.status;
  const granted = result != null && isGrantedStatus(result.status);

  return {
    status,
    result,
    loading,
    isLoading: loading,
    granted,
    error,
    check,
    request,
    ensure,
    openSettings,
  };
}
