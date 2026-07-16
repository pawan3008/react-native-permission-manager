# Example App

Beautiful demo for `react-native-permission-manager`.

## Screens

- Home
- Camera / Microphone / Photos / Notification / Location / Contacts
- Permission Groups (`requestMultiple`)

## Run

From the repo root:

```bash
yarn install
yarn example
cd example
yarn android   # or yarn ios
```

Wrap your app with `<PermissionProvider>` (already done in `App.tsx`).

## Native projects

Generate full React Native native folders if missing:

```bash
npx @react-native-community/cli init PermissionManagerExample --version 0.75.0
```

Then copy `example/App.tsx` and link the local library via `"react-native-permission-manager": "link:.."`.
