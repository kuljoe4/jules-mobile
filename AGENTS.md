# AGENTS.md — Agent Directives & Repository Architecture

## Repository Hygiene & Git Directives
- **Ignore & Untrack Unnecessary Files**: Always ignore and untrack build artifacts, test run results (e.g. `test-results/`), logs, and temporary files from Git history to prevent unnecessary patch and diff payload bloat.

## Build & Test Architecture
- **Package Manager**: Use `pnpm` (`pnpm install`, `pnpm test`, `pnpm run build`).
- **Modular Source**: Application modules reside in `src/` (`components/`, `config/`, `hooks/`, `services/`, `utils/`) and are tracked in `src/source-manifest.json`.
- **Production Bundle**: `build.js` transpiles JSX/ES modules into `dist/index.html`. Always verify changes with `pnpm run build` and `pnpm test`.
