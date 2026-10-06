import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import express from 'express';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');

function runBuild() {
  try {
    console.log('[server] Building Jules Mobile bundle...');
    execSync('node build.js', { stdio: 'inherit', cwd: __dirname });
  } catch (err) {
    console.error('[server] Build failed:', err.message);
  }
}

// Always ensure initial build exists
if (!fs.existsSync(indexHtmlPath)) {
  runBuild();
}

// Watch src/ and index.html for auto-rebuild during development
let rebuildTimer = null;
function triggerRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    runBuild();
  }, 250);
}

try {
  const srcDir = path.join(__dirname, 'src');
  if (fs.existsSync(srcDir)) {
    fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
      if (filename && !filename.startsWith('.')) {
        triggerRebuild();
      }
    });
  }
  const rootIndex = path.join(__dirname, 'index.html');
  if (fs.existsSync(rootIndex)) {
    fs.watch(rootIndex, (eventType) => {
      triggerRebuild();
    });
  }
} catch (e) {
  console.warn('[server] File watcher could not be initialized:', e.message);
}

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.static(distDir));

// Fallback to index.html for single-page app routing
app.use((req, res) => {
  if (fs.existsSync(indexHtmlPath)) {
    res.sendFile(indexHtmlPath);
  } else {
    res.status(503).send('App is building, please refresh in a moment...');
  }
});

app.listen(PORT, HOST, () => {
  console.log(`[server] Jules Mobile dev server active on http://${HOST}:${PORT}`);
});
