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
- **esbuild** - Blazing-fast JSX compiler (no runtime Babel needed)
- **GitHub Actions** - CI/CD for automatic deploys

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
