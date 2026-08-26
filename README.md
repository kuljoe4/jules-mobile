# Jules Mobile Client

A high-performance, mobile-responsive React web application for monitoring, reviewing, and controlling Jules AI coding agent sessions.

## Overview

Jules Mobile Client provides a unified UI dashboard to manage Jules AI sessions, monitor real-time activity feeds, analyze code diffs and execution plans, track API quota usage, configure personas, and interact directly with background coding sessions.

The app is built as a zero-runtime-transpilation single-file application compiled into static HTML, offering instant startup and offline PWA capabilities without requiring a server-side backend.

---

## Key Features

- **⚡ Instant Startup & Zero-Runtime Transpilation**: Pre-compiled JSX via Babel build pipeline into a self-contained static `dist/index.html`.
- **📱 Responsive & PWA-Ready**: Seamless layout adaptation for mobile and desktop screens with progressive web app (PWA) offline support.
- **📊 Activity Feed & Real-Time Sync**: Live session status monitoring, automatic background polling, and rich activity history (plan progress, terminal logs, code diffs, media artifacts).
- **🔍 Conflict Radar & Working Set Analysis**: File collision detection across active sessions to highlight overlapping file edits in real time.
- **📈 Payload & Performance Insights**: Interactive payload breakdown modal displaying categorized metrics (Media, Code Diffs, Messages, Overhead) with caching and byte optimization suggestions.
- **⏱️ Quota & Usage Tracking**: High-density 24-hour rolling window quota timeline and session rate visualizer.
- **💡 Lean Payload Mode**: Per-repository customizable system directives to suppress visual media artifacts and reduce fetch payloads.
- **🎭 Multi-Persona Management**: Custom system prompt personas with prompt expanders and preset controls.
- **🐙 GitHub Integration**: Real-time PR status tracking, branch comparison, ahead/behind commit indicators, and inline PR publication options.
- **🎨 Design Lab & Accessibility**: Side-by-side UI layout comparisons and strict WCAG 2.1 keyboard and screen-reader accessibility standards (`aria-*` attributes and semantic tablists).

---

## Tech Stack

- **Frontend**: React 18 (Classic Runtime)
- **Build Pipeline**: Node.js, Babel (`@babel/core`, `@babel/preset-env`, `@babel/preset-react`)
- **Package Manager**: `pnpm`
- **Testing & Verification**: Node Test Runner, Playwright (`@playwright/test`)
- **CI/CD & Hosting**: GitHub Actions, Static Hosting (GitHub Pages, Vercel)

---

## Development & Testing

### Prerequisites

Ensure [Node.js](https://nodejs.org/) (v18+) and `pnpm` are installed.

### Installation

```bash
pnpm install
```

### Development Server

Build the production bundle and serve it locally:

```bash
pnpm run dev
```

The app will be served at `http://localhost:8080`.

To automatically rebuild on source changes during development:

```bash
pnpm run watch
```

### Running Tests

Execute the utility unit test suite:

```bash
pnpm test
```

To run Playwright verification scripts:

```bash
python3 verify_frontend.py
```

### Production Build

Compile modular source files into `dist/index.html`:

```bash
pnpm run build
```

---

## Architecture & File Structure

The project uses a modular source architecture in `src/` tracked by `src/source-manifest.json`. The custom `build.js` bundler assembles, strips ES module statements, transpiles JSX via Babel, and injects the output into `index.html` at the `%%APP_SCRIPT%%` placeholder.

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions deployment workflow
├── src/
│   ├── bootstrap.jsx           # Application initialization
│   ├── components/             # React components (SessionDetail, SessionCard, DiffViewer, etc.)
│   ├── config/                 # Options, theme, constants, personas
│   ├── hooks/                  # Custom React hooks (useQuotaTracker, useSessionPolling, etc.)
│   ├── services/               # API, GitHubTracker, SafeStorage, NetworkTracker
│   ├── utils/                  # Validation, formatting, caching, date, workingSet
│   ├── main.jsx                # Entry mount script
│   └── source-manifest.json    # Ordered build manifest for source modules
├── tests/
│   └── utils.test.mjs          # Unit tests for core utilities
├── AGENTS.md                   # Repository hygiene directives and conventions
├── build.js                    # Custom Babel transpilation build script
├── index.html                  # Core HTML template with splash screen and PWA bootstrap
├── package.json                # Project dependencies and npm scripts
├── vercel.json                 # Vercel static output configuration
└── verify_frontend.py          # Automated Playwright frontend verification script
```

---

## Key Modules & Services

- **`src/services/api.js`**: Native `fetch` wrapper supporting transient network retries with backoff, offline interception, and API error normalization.
- **`src/services/githubTracker.js`**: Centralized GitHub REST API tracker providing branch/PR caching, rate-limited fetching, and state evaluation.
- **`src/services/storage.js`**: `SafeStorage` wrapper around `localStorage` and `sessionStorage` with validation and error bounds.
- **`src/components/JulesClient.jsx`**: Core session manager state container handling active sessions, polling hooks, and navigation context.
- **`src/components/sessionDetail.jsx`**: Detailed session view featuring activity timelines, diff viewers, plan execution steps, payload breakdowns, and message composition.
- **`src/components/diffViewer.jsx`**: Syntax-highlighted patch diff rendering with byte metrics and clipboard debug export.
- **`src/components/conflictRadar.jsx`**: Real-time cross-session file collision detector.

---

## Deployment

### GitHub Pages (Automatic)

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that triggers on every push to `main` or `master`.

1. Go to **Settings → Pages** in your GitHub repository.
2. Under **Build and deployment**, set the source to **Deploy from a branch**.
3. Select the `gh-pages` branch.

### Static Hosting (Vercel / Netlify / Cloudflare Pages)

Because the output is a purely static bundle (`dist/index.html`), it can be hosted on any static hosting provider. The build configuration outputs to `dist/`.

---

## Security & Storage Notes

- **API Keys**: Google Gemini / Jules API keys and GitHub Personal Access Tokens are stored securely in browser `localStorage` (`SafeStorage`) and never transmitted to external third-party servers.
- **Content Security Policy**: `index.html` implements strict Content Security Policy directives restricting script, style, connect, and media origins.
- **Sanitization**: All dynamic base64 media payloads and external URLs are validated and sanitized (`safeUrl`, `safeMediaBase64`, `safeMediaMimeType`) before rendering to protect against XSS and MIME injection.
