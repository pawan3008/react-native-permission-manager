# Architecture

Rough layout of the package. Dependencies flow inward toward `domain`.

```
app / example
   │
   ▼
presentation/     PermissionManager, hooks, PermissionGate
   │
   ▼
di/container.ts   wires everything together
   │
   ▼
domain/           entities, use cases, repository interface
   │
   ▼
data/             repository impl, mappers, native data source
   │
   ▼
native/           TurboModule Spec + fallback
   │
   ├─ android/ (Kotlin module → PermissionHandler)
   └─ ios/     (Obj-C++ bridge → PermissionManagerImpl)
```

## Rules of thumb

- `domain` stays free of React Native imports.
- `presentation` should not import `data` concretes directly — go through the container.
- `native/NativePermissionManager.ts` is the codegen boundary; keep signatures simple.
- Public `src/index.ts` only re-exports what app authors need.

## Native

Bridge files (`PermissionManagerModule.kt`, `PermissionManager.mm`) stay thin.
Actual permission calls live in `PermissionHandler` / `PermissionManagerImpl` so
they're easier to reason about (and test later) without the RN bridge in the way.

## Tests

- Domain use cases with a fake repository
- Repository / data source with mocks
- `PermissionManager` + hooks with `PermissionManagerContainer.override(...)`
