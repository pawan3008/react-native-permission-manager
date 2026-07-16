# Contributing

Thanks for your interest in contributing to `react-native-permission-manager`!

## Getting started

```bash
yarn install
yarn example
```

## Architecture rules

Please read [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) before contributing. In short:

- `src/domain` must never import from `src/data`, `src/presentation`, or `react-native`.
- `src/data` may depend on `src/domain`, but not on `src/presentation`.
- `src/presentation` may depend on `src/domain` and `src/data` only through the DI container (`src/di`).
- Native bridge access must be isolated behind `src/native` and consumed only via `src/data/datasources`.

## Commit style

Use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `test:`, `refactor:`).

## Before opening a PR

```bash
yarn lint
yarn typecheck
yarn test
```
