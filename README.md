# Jules Mobile Client

A single-file React web app for monitoring and controlling Jules AI coding sessions. Pre-compiled and optimized for GitHub Pages.

## Development

### Quick Start
```bash
npm install
npm run dev
```

This builds the app and opens it in your browser at `http://localhost:8080`.

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
   git add .
   git commit -m "Update app"
   git push
   ```

3. The workflow will automatically build and deploy. Your site will be live at:
   ```
   https://<your-username>.github.io/<repo-name>
   ```

### Manual Deployment
If you prefer to deploy manually:

1. Build locally:
   ```bash
   npm run build
   ```

2. Commit and push the `dist/` folder to your repository

3. Configure GitHub Pages to deploy from the `dist/` folder

## Tech Stack

- **React** 18 - UI framework
- **Babel** - Robust JSX transpiler (pre-compiles UI for production)
- **GitHub Actions** - CI/CD for automatic deploys

## Build Architecture

The application is designed as a single-file React app that is transpiled during the build process to optimize production performance.

1.  **Source File (`index.html`)**: Contains the React application logic within a `<script type="text/babel">` block. This allows for easy development as Babel can compile the JSX in-browser when opened directly.
2.  **Build Script (`build.js`)**: When `npm run build` is executed, this script:
    *   Extracts the JSX code from `index.html`.
    *   Transpiles it using **Babel** (`@babel/core`) into standard JavaScript.
    *   Replaces the original Babel script block with the transpiled code.
    *   Removes development-only dependencies like the `@babel/standalone` CDN script.
    *   Outputs a self-contained, optimized `dist/index.html`.
3.  **Production Startup**: The `dist/index.html` file is served by GitHub Pages (or any static host). Upon loading, it fetches React and ReactDOM from CDNs and executes the pre-compiled JavaScript, mounting the application instantly without any runtime compilation overhead.

## Features

- ✅ Pre-compiled JSX (no Babel at runtime)
- ✅ Single-file app compatible with GitHub Pages
- ✅ PWA-ready with offline support
- ✅ Mobile-responsive UI
- ✅ Automatic deployments via GitHub Actions

## Notes

- The app uses localStorage for API key storage (browser-only, never sent to servers)
- Works entirely client-side — no backend required
- Compatible with GitHub Pages static hosting
