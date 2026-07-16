<p align="center">
  <img src="https://unpkg.com/react-native-permission-manager/docs/banner.png" alt="React Native Permission Manager — One API for all your app permissions" width="100%" />
</p>

# react-native-permission-manager

[![npm version](https://img.shields.io/npm/v/react-native-permission-manager.svg)](https://www.npmjs.com/package/react-native-permission-manager)
[![CI](https://github.com/pawan3008/react-native-permission-manager/actions/workflows/ci.yml/badge.svg)](https://github.com/pawan3008/react-native-permission-manager/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.79%2B-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![New Architecture](https://img.shields.io/badge/New%20Architecture-TurboModules-success)](https://reactnative.dev/docs/the-new-architecture/landing-page)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Production-ready React Native permissions for **Android** and **iOS**, built with **TypeScript**, **TurboModules**, and Clean Architecture.

## Table of contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Props](#props)
- [API](#api)
- [How to run the example](#how-to-run-the-example)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Features

- ✅ **One-line API** — `await PermissionManager.request('camera')`, no boilerplate
- ✅ **Auto rationale dialogs** — Android pre-permission prompts shown automatically (customizable or fully overridable)
- ✅ **`PermissionGate`** — declarative component that renders children only when granted
- ✅ **`usePermission()`** — a single hook for status, request, ensure, and settings
- ✅ **Auto refresh after Settings** — statuses re-check automatically on app foreground / return from Settings
- ✅ **Permission groups** — built-in groups (`media`, `location`, `communication`, …) or ad-hoc lists via `usePermissionGroup` / `PermissionManager.requestGroup`
- ✅ **Strong TypeScript support** — fully typed enums, literal permission names, and discriminated result types
- Unified API across Android & iOS
- TurboModule / New Architecture ready (legacy bridge fallback)
- `PermissionManager` singleton: `check`, `request`, `requestMultiple`, `checkGroup`, `requestGroup`, `ensure`, `openSettings`, listeners
- React hooks + `<PermissionProvider>` + `<PermissionGate>`
- Android rationale dialogs + auto Settings redirect when permanently denied
- Camera, Microphone, Photos, Notifications, Location, Contacts, Calendar, Bluetooth, Storage, SMS, Call Phone

## Requirements

- React Native **0.73+** (0.79+ recommended)
- Node **18+**

## Installation

```bash
npm install react-native-permission-manager
# or
yarn add react-native-permission-manager
```

Rebuild the native app after install (`npx pod-install` on iOS, then run Android/iOS).

### iOS (`Info.plist`)

Add a usage string for **every** permission you request. Missing keys cause iOS to
**abort the app** (`abort_with_payload`) when you call `request()` — the library
detects this and returns `UNAVAILABLE` with a console warning instead of crashing,
but real prompts only appear after you add the keys:

```xml
<!-- Camera / Mic / Photos -->
<key>NSCameraUsageDescription</key>
<string>Camera access is needed to take photos.</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is needed for audio.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Photo library access is needed to pick images.</string>

<!-- Contacts -->
<key>NSContactsUsageDescription</key>
<string>Contacts access is needed to find friends.</string>

<!-- Location (foreground) -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>Location access is needed to show nearby content.</string>

<!-- Location (background / always) — also keep the WhenInUse key above -->
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Background location is needed for continuous updates.</string>
<!-- Optional legacy: NSLocationAlwaysUsageDescription -->

<!-- Calendar (iOS 17+ prefers FullAccess) -->
<key>NSCalendarsUsageDescription</key>
<string>Calendar access is needed to manage events.</string>
<key>NSCalendarsFullAccessUsageDescription</key>
<string>Calendar access is needed to manage events.</string>

<!-- Bluetooth -->
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth access is needed to connect to devices.</string>
```

```bash
cd ios && pod install && cd ..
```

### Android (`AndroidManifest.xml`)

The library does **not** inject permissions (avoids Manifest Merger conflicts).  
Declare only what your app uses:

```xml
<!-- Camera / Mic / Notifications -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Contacts -->
<uses-permission android:name="android.permission.READ_CONTACTS" />

<!-- Location -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<!-- Background location (Android 10+) — also declare Fine/Coarse above -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Photos / Storage (API 33+) -->
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
<!-- Older devices -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />

<!-- Calendar / Bluetooth / Phone (as needed) -->
<uses-permission android:name="android.permission.READ_CALENDAR" />
<uses-permission android:name="android.permission.WRITE_CALENDAR" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.READ_SMS" />
<uses-permission android:name="android.permission.CALL_PHONE" />
```

| Friendly name | Android permission(s) | iOS Info.plist key |
|---------------|----------------------|--------------------|
| `camera` | `CAMERA` | `NSCameraUsageDescription` |
| `microphone` | `RECORD_AUDIO` | `NSMicrophoneUsageDescription` |
| `photos` | `READ_MEDIA_IMAGES` + `READ_MEDIA_VIDEO` (API 33+) | `NSPhotoLibraryUsageDescription` |
| `notification` | `POST_NOTIFICATIONS` (API 33+) | _(none — system prompt)_ |
| `contacts` | `READ_CONTACTS` | `NSContactsUsageDescription` |
| `location` | `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` | `NSLocationWhenInUseUsageDescription` |
| `locationBackground` | `ACCESS_BACKGROUND_LOCATION` | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| `calendar` | `READ_CALENDAR` + `WRITE_CALENDAR` | `NSCalendarsUsageDescription` / FullAccess |
| `bluetooth` | `BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT` (API 31+) | `NSBluetoothAlwaysUsageDescription` |
| `sms` | `READ_SMS` | _(unavailable on iOS)_ |
| `callPhone` | `CALL_PHONE` | _(unavailable on iOS)_ |

## Usage

```tsx
import {
  PermissionManager,
  PermissionProvider,
  PermissionGate,
  usePermission,
} from 'react-native-permission-manager';
```

### 1. Imperative (`PermissionManager`)

```tsx
const result = await PermissionManager.check('camera');
// { type, status, canAskAgain }

await PermissionManager.request('camera', {
  title: 'Camera',
  message: 'Needed for your profile photo',
});

await PermissionManager.ensure('camera'); // request → Settings if blocked
await PermissionManager.openSettings();

// Permission groups — built-in name or an ad-hoc list
const { allGranted, results } = await PermissionManager.requestGroup('media');
await PermissionManager.checkGroup(['camera', 'microphone']);
```

### 2. Hook (`usePermission`)

```tsx
function CameraButton() {
  const { status, granted, loading, request, ensure, openSettings } =
    usePermission('camera', {
      title: 'Camera',
      message: 'Needed for profile photo',
    });

  if (loading) return null;
  if (granted) return <OpenCamera />;

  return (
    <Button
      title={status === 'BLOCKED' ? 'Open Settings' : 'Allow Camera'}
      onPress={() => (status === 'BLOCKED' ? openSettings() : request())}
    />
  );
}
```

### 3. Provider (recommended at app root)

```tsx
function App() {
  return (
    <PermissionProvider watchedPermissions={['camera', 'microphone', 'notification']}>
      <RootNavigator />
    </PermissionProvider>
  );
}
```

Caches statuses and refreshes when the app returns from Settings.

### 4. PermissionGate

```tsx
<PermissionGate
  permission="camera"
  autoRequest
  renderFallback={({ ensure, openSettings }) => (
    <>
      <Button title="Grant camera" onPress={() => ensure()} />
      <Button title="Open Settings" onPress={() => openSettings()} />
    </>
  )}
>
  <CameraScreen />
</PermissionGate>
```

### 5. Permission Groups

Bundle related permissions and check/request them together, using a built-in group name or your own list:

```tsx
import { usePermissionGroup } from 'react-native-permission-manager';

function MediaScreen() {
  const { results, allGranted, anyGranted, loading, request } = usePermissionGroup('media');
  // 'media' = ['camera', 'microphone', 'photos']

  if (loading) return null;

  return (
    <Button
      title={allGranted ? 'All set' : 'Grant media access'}
      onPress={() => request()}
    />
  );
}
```

Built-in groups (`PERMISSION_GROUPS`):

| Group | Permissions |
|-------|-------------|
| `media` | `camera`, `microphone`, `photos` |
| `location` | `location`, `locationBackground` |
| `contactsAndCalendar` | `contacts`, `calendar` |
| `communication` | `sms`, `callPhone`, `contacts` |
| `connectivity` | `notification`, `bluetooth` |

You can also pass an ad-hoc array instead of a group name: `usePermissionGroup(['camera', 'location'])`.

## Props

### `<PermissionProvider />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | App tree |
| `watchedPermissions` | `PermissionInput[]` | `[]` | Permissions to check on mount / resume |
| `refreshOnForeground` | `boolean` | `true` | Re-check when app becomes active |

### `<PermissionGate />`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `permission` | `PermissionInput` | — | Permission to gate on |
| `children` | `ReactNode` | — | Rendered when granted / limited |
| `config` | `PermissionOptions` | — | Rationale / settings options |
| `autoRequest` | `boolean` | `true` | Request on mount if not granted |
| `fallback` | `ReactNode` | `null` | Simple fallback UI |
| `renderFallback` | `(args) => ReactNode` | — | Custom fallback with `request` / `ensure` / `openSettings` |
| `renderLoading` | `() => ReactNode` | spinner | Loading UI |

### `usePermission(permission, options?)` returns

| Field | Type | Description |
|------|------|-------------|
| `status` | `PermissionStatus \| undefined` | Current status |
| `granted` | `boolean` | `true` if granted or limited |
| `loading` | `boolean` | Check/request in progress |
| `error` | `Error \| undefined` | Last error |
| `result` | `PermissionResult \| undefined` | Full result object |
| `check()` | `() => Promise<PermissionResult>` | Re-check |
| `request(options?)` | `() => Promise<PermissionResult>` | Request |
| `ensure(options?)` | `() => Promise<PermissionResult>` | Request + Settings flow |
| `openSettings()` | `() => Promise<void>` | Open OS settings |

### `usePermissionGroup(groupNameOrList)` returns

| Field | Type | Description |
|------|------|-------------|
| `results` | `PermissionResult[]` | One result per permission, in group order |
| `allGranted` | `boolean` | `true` only if every permission is granted/limited |
| `anyGranted` | `boolean` | `true` if at least one permission is granted/limited |
| `loading` | `boolean` | Check/request in progress |
| `error` | `Error \| undefined` | Last error |
| `check()` | `() => Promise<PermissionGroupResult>` | Re-check the whole group |
| `request(options?)` | `() => Promise<PermissionGroupResult>` | Request the whole group |

### `PermissionOptions` (request / ensure / config)

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Rationale dialog title (content only — does not force the dialog to appear) |
| `message` | `string` | Rationale dialog body (content only — does not force the dialog to appear) |
| `confirmLabel` | `string` | Confirm button |
| `cancelLabel` | `string` | Cancel button |
| `showRationale` | `boolean` | Enable/disable the automatic rationale flow entirely (default: `true` on Android). When enabled, the dialog is only ever shown if Android's `shouldShowRequestPermissionRationale` returns `true` (i.e. after a prior denial) — never on the very first request. |
| `redirectToSettingsOnBlocked` | `boolean` | Open Settings when blocked |
| `settingsTitle` | `string` | Settings dialog title |
| `settingsMessage` | `string` | Settings dialog body |
| `renderRationale` | `(args) => Promise<boolean>` | Custom rationale UI |
| `renderSettingsPrompt` | `(args) => Promise<boolean>` | Custom Settings UI |

## Permission names

| Name | Enum |
|------|------|
| `camera` | `PermissionType.CAMERA` |
| `microphone` | `PermissionType.MICROPHONE` |
| `photos` | `PermissionType.PHOTO_LIBRARY` |
| `notification` | `PermissionType.NOTIFICATIONS` |
| `contacts` | `PermissionType.CONTACTS` |
| `location` | `PermissionType.LOCATION_FOREGROUND` |
| `calendar` | `PermissionType.CALENDAR` |
| `bluetooth` | `PermissionType.BLUETOOTH` |
| `storage` | `PermissionType.STORAGE` |
| `locationBackground` | `PermissionType.LOCATION_BACKGROUND` |
| `sms` | `PermissionType.SMS` |
| `callPhone` | `PermissionType.CALL_PHONE` |

## API

### `PermissionManager`

| Method | Description |
|--------|-------------|
| `check(permission)` | Read current status (no prompt) |
| `request(permission, options?)` | Request access |
| `requestMultiple(permissions, options?)` | Batch request |
| `checkGroup(groupNameOrList)` | Check every permission in a group (no prompt) |
| `requestGroup(groupNameOrList, options?)` | Request every permission in a group |
| `ensure(permission, options?)` | Request; if blocked → dialog → Settings → re-check |
| `openSettings()` | Open OS app settings |
| `shouldShowRationale(permission)` | Android rationale hint |
| `addListener(fn)` / `removeListener(fn)` | Status change events |
| `getCached(permission)` | In-memory snapshot |

### Status values

`GRANTED` · `DENIED` · `BLOCKED` · `LIMITED` · `UNAVAILABLE` · `NOT_DETERMINED`

| Status | Meaning | Typical next step |
|--------|---------|-------------------|
| `NOT_DETERMINED` | Never asked | `request()` / `ensure()` |
| `DENIED` | Refused, but OS may allow asking again (**mainly Android** after first deny) | Show rationale, then `request()` again |
| `BLOCKED` | Permanently denied / cannot re-prompt from the app | `openSettings()` / `ensure()` |
| `GRANTED` / `LIMITED` | Usable | Proceed |
| `UNAVAILABLE` | Not supported, not declared in manifest/Info.plist, **or native module not linked** | Fix app config / rebuild |

**iOS note:** For Contacts, Camera, Microphone, Photos, and Notifications, a **first Deny** from the system dialog maps to `BLOCKED` (not `DENIED`). That matches iOS reality — the OS will not show that prompt again; only Settings can change it. Android often returns `DENIED` first (rationale / re-prompt possible) and upgrades to `BLOCKED` only after “Don’t ask again” / permanent deny.

## How to run the example

```bash
# clone repo
git clone https://github.com/pawan3008/react-native-permission-manager.git
cd react-native-permission-manager

yarn install
yarn example          # install example deps

cd example
yarn android          # or: yarn ios
```

Example screens: Camera, Microphone, Photos, Notification, Location, Contacts, Permission Groups.

More detail: [example/README.md](./example/README.md).

## FAQ

**Does this support the New Architecture?**  
Yes — TurboModule Spec + codegen, with old bridge fallback.

**What is `ensure`?**  
Requests if needed; if permanently denied (`BLOCKED`), shows a dialog, opens Settings, then re-checks.

**Can I customize the rationale UI?**  
Yes — `renderRationale` / `renderSettingsPrompt`, or default `Alert` dialogs.

**Will passing `title`/`message` to `request()` always pop a dialog?**  
No. `title`/`message` only customize the dialog's *content* if/when it's shown. The dialog itself is triggered solely by Android's `shouldShowRequestPermissionRationale` (i.e. only after the user has previously denied the permission). On a first-ever request, no dialog appears even if you pass `title`/`message` — the system permission prompt goes straight through. Set `showRationale: false` to disable the rationale flow entirely.

**Do I need every permission in the manifest / Info.plist?**  
No — declare only what your app uses. On Android, if you request a permission that isn't in your `AndroidManifest.xml`, the library returns `UNAVAILABLE` (not a silent `BLOCKED`) and logs a clear warning such as `READ_MEDIA_IMAGES not declared in AndroidManifest.xml` (Logcat + Metro). On iOS, a missing usage string (e.g. `NSContactsUsageDescription`) would normally **crash** the app with `abort_with_payload` — the library detects that, returns `UNAVAILABLE`, and warns instead; still add the Info.plist key for a real system prompt.

**Why does Contacts return `BLOCKED` right after the first Deny on iOS?**  
Because iOS will not show the Contacts prompt again from your app. `BLOCKED` means “only Settings can change this” (`canAskAgain: false`). On Android the same first deny is usually `DENIED` and you can ask again.

**What if the native module isn’t linked / I forgot to rebuild?**  
Calls resolve to `UNAVAILABLE` and a one-time console warning — the JS app does **not** hard-crash. Fix: rebuild native (`pod install` on iOS, clean Android build).

**What happens if `request()`/`ensure()` is called twice at once (double-tap, race, etc.)?**  
Calls are automatically coalesced under the hood: if a native prompt for the same permission (or the same batch, for `requestMultiple`/`requestGroup`) is already in flight, subsequent calls just await that same in-flight promise instead of triggering another native `requestPermissions()` call. This avoids the dialog glitches/crashes that can happen on Android when the permission dialog is requested concurrently. No API changes required — it's transparent.

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [docs/API.md](./docs/API.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

```bash
yarn install
yarn lint
yarn typecheck
yarn test
yarn build
```

## License

MIT © [Pawan Vishwakarma](https://github.com/pawan3008)
