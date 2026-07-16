import { Alert } from 'react-native';
import type { PermissionType } from '../../domain/entities/PermissionType';
import type { PermissionOptions } from '../../types/permissions';
import { DefaultDialogCopy } from '../../utils/constants';

/**
 * Shows a rationale / settings dialog. Supports custom UI via options.
 * Returns `true` if the user confirmed, `false` otherwise.
 */
export async function presentPermissionDialog(params: {
  permission: PermissionType;
  kind: 'rationale' | 'settings';
  options?: PermissionOptions;
}): Promise<boolean> {
  const { permission, kind, options } = params;

  if (kind === 'rationale' && options?.renderRationale) {
    return options.renderRationale({
      permission,
      title: options.title ?? DefaultDialogCopy.rationaleTitle,
      message: options.message ?? DefaultDialogCopy.rationaleMessage,
    });
  }

  if (kind === 'settings' && options?.renderSettingsPrompt) {
    return options.renderSettingsPrompt({
      permission,
      title: options.settingsTitle ?? DefaultDialogCopy.settingsTitle,
      message: options.settingsMessage ?? DefaultDialogCopy.settingsMessage,
    });
  }

  const title =
    kind === 'rationale'
      ? (options?.title ?? DefaultDialogCopy.rationaleTitle)
      : (options?.settingsTitle ?? DefaultDialogCopy.settingsTitle);

  const message =
    kind === 'rationale'
      ? (options?.message ?? DefaultDialogCopy.rationaleMessage)
      : (options?.settingsMessage ?? DefaultDialogCopy.settingsMessage);

  const confirmLabel =
    kind === 'rationale'
      ? (options?.confirmLabel ?? DefaultDialogCopy.rationaleConfirm)
      : (options?.confirmLabel ?? DefaultDialogCopy.settingsConfirm);

  const cancelLabel =
    options?.cancelLabel ??
    (kind === 'rationale' ? DefaultDialogCopy.rationaleCancel : DefaultDialogCopy.settingsCancel);

  return new Promise<boolean>(resolve => {
    Alert.alert(
      title,
      message,
      [
        {
          text: cancelLabel,
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: confirmLabel,
          onPress: () => resolve(true),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
