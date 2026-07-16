# Architecture

`react-native-permission-manager` follows **Clean Architecture** with strict, one-directional
dependencies between layers, plus a **native mirror** of the same separation on
Android/iOS.

```
                       ┌─────────────────────────────┐
                       │   Consumer App (example/)   │
                       └───────────────┬─────────────┘
                                       │ imports public API
                                       ▼
┌───────────────────────────────────────────────────────────────────┐
│ presentation/            (React-facing: facade, hooks, components) │
│   PermissionManager.ts   (Facade)                                   │
│   hooks/                 (usePermission, usePermissionStatus, ...)  │
│   components/            (<PermissionGate />)                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ resolves deps via
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│ di/container.ts          (Composition root — wires concretes to    │
│                            abstractions; the ONLY place that        │
│                            `new`s data/domain classes)               │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ injects
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│ domain/                  (Pure TypeScript, zero RN dependency)      │
│   entities/               Permission, PermissionType, PermissionStatus│
│   usecases/                CheckPermissionUseCase, RequestPermission…│
│   repositories/            IPermissionRepository (abstraction only)  │
│   errors/                  PermissionError, PermissionOperationError │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ implemented by
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│ data/                    (Implements domain abstractions)           │
│   repositories/            PermissionRepository implements           │
│                             IPermissionRepository                    │
│   mappers/                  PermissionStatusMapper, PermissionTypeMapper│
│   datasources/               IPermissionDataSource,                  │
│                              NativePermissionDataSource               │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ calls
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│ native/                  (Codegen boundary — TurboModule spec)      │
│   NativePermissionManager.ts (Spec, consumed by codegen)             │
│   NativeModuleFallback.ts     (legacy bridge resolution)             │
└───────────────────────────────┬─────────────────────────────────────┘
                                 │ generates / bridges to
                    ┌────────────┴────────────┐
                    ▼                         ▼
        ┌─────────────────────┐   ┌─────────────────────┐
        │ android/ (Kotlin)   │   │ ios/ (Obj-C++)       │
        │  Module → Handler   │   │  Bridge → Impl       │
        │  (bridge / logic     │   │  (bridge / logic     │
        │   split, mirrors     │   │   split, mirrors     │
        │   JS side)           │   │   JS side)            │
        └─────────────────────┘   └─────────────────────┘
```

## Dependency rules

1. `domain` depends on **nothing** in this repo except other `domain` files. No `react`,
   no `react-native`, no `data`, no `presentation`.
2. `data` depends only on `domain` (to implement its interfaces) and `native`.
3. `presentation` depends only on `domain` (types) and resolves `data`/`domain` instances
   exclusively through `di/container.ts` — never by importing `data` concretes directly.
4. `native` has no outgoing dependency on any other `src/*` folder; it is the codegen
   boundary and must stay codegen-compatible (primitives, arrays, plain objects only).
5. Public API (`src/index.ts`) re-exports **only** `presentation`, domain entities/enums,
   domain errors, and `types` — `data`, `native`, and `di` are internal.

## SOLID mapping

| Principle | Where it shows up |
|---|---|
| Single Responsibility | One class per use case (`CheckPermissionUseCase`, `RequestPermissionUseCase`, ...); mappers only map; data sources only do native I/O. |
| Open/Closed | New permission types are added by extending `PermissionType` + mappers, without modifying use cases or the facade. |
| Liskov Substitution | Any `IPermissionRepository` implementation (real, fake, mock) is interchangeable wherever the interface is used. |
| Interface Segregation | `IUseCase<TInput, TOutput>` / `INoInputUseCase<TOutput>` are minimal, single-method contracts. |
| Dependency Inversion | `domain` defines `IPermissionRepository`; `data` implements it. `presentation` depends on abstractions resolved via `di/container.ts`, never concretes. |

## Native-side mirroring

Both `android/` and `ios/` split the **bridge/glue** (`PermissionManagerModule.kt`,
`PermissionManager.mm`) from the **actual logic** (`domain/PermissionHandler.kt`,
`PermissionManagerImpl.m`), so native logic can be unit tested (JUnit/XCTest) without
a running bridge — the same separation of concerns applied on the JS side.

## Testing strategy

- `__tests__/domain/**` — pure unit tests against use cases with a fake `IPermissionRepository`.
- `__tests__/data/**` — repository/mapper tests against a mocked `IPermissionDataSource`.
- `__tests__/presentation/**` — hook/facade tests with the DI container overridden
  (`PermissionManagerContainer.override(...)`) to inject fakes.
- Native unit tests (JUnit / XCTest) are expected under `android/src/test` and an iOS test
  target, added during the implementation phase.
