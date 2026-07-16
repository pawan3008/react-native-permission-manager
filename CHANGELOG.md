# Changelog

## 0.2.0

### Added

- Permission Groups: built-in named groups (`media`, `location`, `contactsAndCalendar`, `communication`, `connectivity`) plus support for ad-hoc lists
- `PermissionManager.checkGroup()` / `PermissionManager.requestGroup()` for one-line group checks/requests
- `usePermissionGroup(groupNameOrList)` hook with `allGranted` / `anyGranted` and auto-refresh after Settings / app foreground
- `useMultiplePermissions` now also accepts a built-in group name in addition to a raw permission list

## 0.1.0

### Added

- Production TypeScript API with Clean Architecture (`domain` → `data` → `presentation`)
- `PermissionManager` singleton: `check`, `request`, `requestMultiple`, `ensure`, `openSettings`, listeners
- Friendly `PermissionName` aliases (`camera`, `microphone`, `photos`, …)
- React hooks: `usePermission`, `usePermissionStatus`, `useMultiplePermissions`
- `<PermissionProvider>` with cache + AppState refresh
- `<PermissionGate>` with auto-request, loading, and custom fallback
- Android Kotlin handler (API 23–36): Camera, Mic, Photos, Storage, Notifications, Bluetooth, Location, Contacts, Calendar
- iOS Swift handler: Camera, Microphone, Photos, Contacts, Location, Notifications, Calendar, Bluetooth
- Android rationale dialogs + Settings redirect on permanently denied
- Example app screens for each permission group
- Jest unit tests, ESLint + Prettier, GitHub Actions CI / release workflows
