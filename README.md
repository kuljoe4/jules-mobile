# Jules Mobile Client

A React web application for monitoring and controlling Jules AI coding sessions.

## Development

### Quick Start
```bash
npm install
npm run dev
```

This builds the app and serves it on `http://localhost:8080`.

### Build for Production
```bash
npm run build
```

Output is in the `dist/` folder, ready to deploy.

## Deployment to GitHub Pages

### Automatic (Recommended)
The repository includes a GitHub Actions workflow that automatically builds and deploys on every push to `master` or `main`.

1. **Enable GitHub Pages:**
   - Go to **Settings → Pages**
   - Set "Build and deployment" to **Deploy from a branch**
   - Select **gh-pages** branch (created by the workflow)

2. **Push your changes:**
   ```bash
   git push
   ```

3. The workflow will automatically build and deploy.

## Tech Stack

- **React** 18 - UI framework
- **Babel** - Pre-compiles JSX for production performance
- **GitHub Actions** - CI/CD for automatic deploys

## Build Architecture

The application uses a custom `build.js` script to transform the source into a highly optimized, production-ready single-file application.

1.  **Source Structure**: The application is organized in `src/` into components, services, hooks, and utilities.
2.  **Build Process (`build.js`)**:
    *   Reads the `source-manifest.json` to assemble modules.
    *   Transpiles JSX to standard JavaScript using **Babel**.
    *   Injects the compiled application code into `index.html` at the `%%APP_SCRIPT%%` placeholder.
    *   Produces a self-contained, optimized `dist/index.html`.
3.  **Production**: The `dist/index.html` file is served statically, providing instant startup with no runtime compilation overhead.

## Key Components

- **`Shell.jsx`**: The main application container and layout manager.
- **`JulesClient.jsx`**: The core logic interface for interacting with the Jules agent.
- **`ErrorBoundary.jsx`**: Global error handling to ensure app stability.
- **Components (`activityFeed`, `quotaTimeline`, `sessionDetail`, etc.)**: Modular building blocks for the user interface.

## Features

- ✅ Pre-compiled JSX (zero runtime transpilation)
- ✅ PWA-ready with offline support
- ✅ Mobile-responsive UI
- ✅ High-density Quota Tracking
- ✅ Unified Session/Sync management
- ✅ Automated deployments via GitHub Actions

## Notes

- The app uses `localStorage` for API key storage (browser-only, never sent to servers).
- The application operates entirely client-side — no backend required.
- Compatible with any static host (GitHub Pages, Vercel, Netlify).
