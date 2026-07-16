# API Reference

## PermissionManager

```ts
import { PermissionManager } from 'react-native-permission-manager';

await PermissionManager.check('camera');
await PermissionManager.request('camera', {
  title: 'Camera',
  message: 'Needed for profile photo',
});
await PermissionManager.requestMultiple(['camera', 'microphone']);
await PermissionManager.checkGroup('media'); // built-in group or a raw array
await PermissionManager.requestGroup('media');
await PermissionManager.ensure('camera');
await PermissionManager.openSettings();
await PermissionManager.shouldShowRationale('camera');

const unsubscribe = PermissionManager.addListener((result) => {
  console.log(result.type, result.status);
});
unsubscribe();
```

## Types

- `PermissionName` — `'camera' | 'microphone' | 'photos' | …`
- `PermissionType` — enum
- `PermissionStatus` — `GRANTED | DENIED | BLOCKED | LIMITED | UNAVAILABLE | NOT_DETERMINED`
- `PermissionResult` — `{ type, status, canAskAgain }`
- `PermissionGroupResult` — `{ group, results, allGranted, anyGranted }`
- `PermissionGroupName` — `'media' | 'location' | 'contactsAndCalendar' | 'communication' | 'connectivity'`
- `PermissionOptions` — rationale / settings dialog configuration
- `PermissionListener` — status-change callback

## Hooks

- `usePermission(permission, options?)`
- `usePermissionStatus(permission)`
- `useMultiplePermissions(permissionsOrGroup)`
- `usePermissionGroup(groupNameOrList)`

## Components

- `<PermissionProvider watchedPermissions={...}>`
- `<PermissionGate permission="camera">`

## Errors

- `PermissionError` (abstract)
- `PermissionOperationError`
