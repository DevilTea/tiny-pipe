# AGENTS.md

## Project Overview

`@deviltea/tiny-pipe` is a tiny, type-safe pipe function builder. It builds sequences of sync or async operations with built-in safe error handling (`pipe` / `pipeSafely`), published as a dual ESM/CJS package with full type inference.

**Repository structure:**
```
src/index.ts          # Entire library implementation (single file)
test/index.test.ts    # Vitest test suite
build.config.ts       # unbuild config (outputs to dist/)
tsconfig.*.json       # Split configs: lib / node / test
```

## Setup Commands

```bash
# Install dependencies
pnpm install

# Build (unbuild -> dist/)
pnpm build

# Build in stub mode for local development
pnpm dev

# Run tests (watch mode) / with coverage
pnpm test
pnpm test:cov

# Lint and fix
pnpm lint
pnpm lint:fix

# Type check (uses tsconfig.test.json)
pnpm typecheck
```

## Code Style

- TypeScript strict mode via `@deviltea/tsconfig`
- ESLint flat config extending `@deviltea/eslint-config` (single quotes, no semicolons, tabs)
- The whole library lives in `src/index.ts` — keep it single-file and dependency-free
- `sideEffects: false`; keep exports tree-shakable

## Testing

- Vitest; tests live in `test/index.test.ts`
- Run a single test with `pnpm test -- -t '<name>'`
- Pre-commit hook (simple-git-hooks) runs `lint-staged` (`eslint --fix`)

## Release

- `pnpm release` — runs `bumpp` (version bump + git tag + push) then `npm publish`
- Pushing a `v*` tag triggers `.github/workflows/release.yml` (changelogithub generates GitHub release notes)
- `prepublishOnly` builds automatically before publish

## Gotchas

- `pnpm-workspace.yaml` exists only to hold pnpm supply-chain security settings (this is a single-package repo); `strictDepBuilds` is on — new deps that need build scripts must be reviewed into `onlyBuiltDependencies`/`ignoredBuiltDependencies`
- Node >= 20 required (`engines`)
