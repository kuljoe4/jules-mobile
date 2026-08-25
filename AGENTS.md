# AGENTS.md — Agent Directives & Repository Architecture

## Lean Payload Directive
- **Skip Media Artifacts**: Do not capture, record, or attach visual media artifacts (such as Playwright screenshots or WebM videos) during task execution unless explicitly requested by the user for visual bug auditing. This drastically reduces activity payload sizes.

## Build & Test Architecture
- **Package Manager**: Use `pnpm` (`pnpm install`, `pnpm test`, `pnpm run build`).
- **Modular Source**: Application modules reside in `src/` (`components/`, `config/`, `hooks/`, `services/`, `utils/`) and are tracked in `src/source-manifest.json`.
- **Production Bundle**: `build.js` transpiles JSX/ES modules into `dist/index.html`. Always verify changes with `pnpm run build` and `pnpm test`.
