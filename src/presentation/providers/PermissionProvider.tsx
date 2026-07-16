import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { PermissionType } from '../../domain/entities/PermissionType';
import type { PermissionResult } from '../../types/PermissionResult';
import type { PermissionInput } from '../../types/permissions';
import { resolvePermissionType } from '../../types/permissions';
import { PermissionManager } from '../PermissionManager';
import { Logger } from '../../utils/Logger';

export interface PermissionContextValue {
  /** Cached permission snapshots keyed by PermissionType. */
  cache: ReadonlyMap<PermissionType, PermissionResult>;
  /** Refresh one or more permissions from native (e.g. after Settings). */
  refresh: (permissions?: readonly PermissionInput[]) => Promise<void>;
  get: (permission: PermissionInput) => PermissionResult | undefined;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

export interface PermissionProviderProps {
  children: ReactNode;
  /** Permissions to eagerly check on mount and when the app resumes. */
  watchedPermissions?: readonly PermissionInput[];
  /** Re-check watched permissions when app returns to foreground. Default true. */
  refreshOnForeground?: boolean;
}

/**
 * Caches permission states, fans out listener updates, and refreshes
 * when the app returns from Settings / background.
 */
export function PermissionProvider({
  children,
  watchedPermissions = [],
  refreshOnForeground = true,
}: PermissionProviderProps): JSX.Element {
  const [cacheVersion, setCacheVersion] = useState(0);
  const watchedRef = useRef(watchedPermissions);
  watchedRef.current = watchedPermissions;

  const bump = useCallback(() => {
    setCacheVersion(v => v + 1);
  }, []);

  const refresh = useCallback(
    async (permissions?: readonly PermissionInput[]) => {
      const list = permissions ?? watchedRef.current;
      await Promise.all(
        list.map(async permission => {
          try {
            await PermissionManager.check(permission);
          } catch (error) {
            Logger.warn('Failed to refresh permission', permission, error);
          }
        }),
      );
      bump();
    },
    [bump],
  );

  useEffect(() => {
    const unsubscribe = PermissionManager.addListener(() => {
      bump();
    });
    return unsubscribe;
  }, [bump]);

  useEffect(() => {
    if (watchedPermissions.length > 0) {
      void refresh(watchedPermissions);
    }
  }, [refresh, watchedPermissions]);

  useEffect(() => {
    if (!refreshOnForeground) {
      return;
    }

    const onChange = (next: AppStateStatus) => {
      if (next === 'active' && watchedRef.current.length > 0) {
        void refresh();
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, [refresh, refreshOnForeground]);

  const value = useMemo<PermissionContextValue>(() => {
    // cacheVersion forces memo invalidation when statuses change
    void cacheVersion;
    return {
      cache: new Map(
        // Rebuild from PermissionManager singleton cache for watched + others
        Array.from(
          // Access via getCached for each watched key; store uses singleton
          watchedRef.current
            .map(p => {
              const type = resolvePermissionType(p);
              const result = PermissionManager.getCached(type);
              return result != null ? ([type, result] as const) : null;
            })
            .filter((entry): entry is readonly [PermissionType, PermissionResult] => entry != null),
        ),
      ),
      refresh,
      get: (permission: PermissionInput) => PermissionManager.getCached(permission),
    };
  }, [cacheVersion, refresh]);

  return <PermissionContext.Provider value={value}>{children}</PermissionContext.Provider>;
}

export function usePermissionContext(): PermissionContextValue | null {
  return useContext(PermissionContext);
}

export function usePermissionContextRequired(): PermissionContextValue {
  const ctx = useContext(PermissionContext);
  if (ctx == null) {
    throw new Error('usePermissionContextRequired must be used within a <PermissionProvider>.');
  }
  return ctx;
}
