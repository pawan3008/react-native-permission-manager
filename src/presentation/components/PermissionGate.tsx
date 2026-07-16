import { useEffect, useRef, type ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import type { PermissionInput, PermissionOptions } from '../../types/permissions';
import { usePermission } from '../hooks/usePermission';

export interface PermissionGateProps {
  permission: PermissionInput;
  config?: PermissionOptions;
  /** Automatically request the permission on mount. Default true. */
  autoRequest?: boolean;
  /** Rendered while the permission is being checked/requested. */
  renderLoading?: () => ReactNode;
  /** Rendered when the permission is granted (or limited). */
  children: ReactNode;
  /** Rendered when the permission is denied/blocked/unavailable. */
  fallback?: ReactNode;
  /** Rendered when the permission is denied/blocked/unavailable. */
  renderFallback?: (args: {
    openSettings: () => Promise<void>;
    request: () => Promise<void>;
    ensure: () => Promise<void>;
  }) => ReactNode;
}

/**
 * Declarative gate that renders children only when a permission is granted.
 */
export function PermissionGate({
  permission,
  config,
  autoRequest = true,
  renderLoading,
  children,
  fallback = null,
  renderFallback,
}: PermissionGateProps): JSX.Element | null {
  const { granted, loading, request, ensure, openSettings } = usePermission(permission, config);
  const didAutoRequest = useRef(false);

  useEffect(() => {
    didAutoRequest.current = false;
  }, [permission]);

  useEffect(() => {
    if (!autoRequest || didAutoRequest.current || loading || granted) {
      return;
    }
    didAutoRequest.current = true;
    void request();
  }, [autoRequest, granted, loading, request]);

  if (loading) {
    if (renderLoading) {
      return <>{renderLoading()}</>;
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (granted) {
    return <>{children}</>;
  }

  if (renderFallback) {
    return (
      <>
        {renderFallback({
          openSettings,
          request: async () => {
            await request();
          },
          ensure: async () => {
            await ensure();
          },
        })}
      </>
    );
  }

  return <>{fallback}</>;
}
