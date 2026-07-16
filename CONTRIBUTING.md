# Contributing

PRs welcome.

```bash
yarn install
yarn example
```

Keep `src/domain` free of RN imports. Prefer going through `src/di` instead of reaching into `data` from presentation. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) if you're unsure where something belongs.

Commits: conventional style is fine (`feat:`, `fix:`, `docs:`, …).

Before opening a PR:

```bash
yarn lint
yarn typecheck
yarn test
```
