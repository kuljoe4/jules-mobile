import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babel from '@babel/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_PLACEHOLDER = '%%APP_SCRIPT%%';

function readSourceManifest() {
  const manifestPath = path.join(__dirname, 'src', 'source-manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}

function readAppSource(files) {
  return files
    .map(file => {
      const sourcePath = path.join(__dirname, file);
      const source = fs.readFileSync(sourcePath, 'utf-8')
        .replace(/^\s*import\s+[^;]+;\s*$/gm, '')
        .replace(/^\s*export\s+\{[^}]+\}(?:\s*from\s*['"][^'"]+['"])?;?\s*$/gm, '')
        .replace(/\bexport\s+default\s+/g, '')
        .replace(/\bexport\s+(?=(const|let|var|function|class)\b)/g, '');
      return `\n/* ---- ${file} ---- */\n${source}`;
    })
    .join('\n');
}

async function transpileApp(source) {
  const result = await babel.transformAsync(source, {
    filename: 'src/main.jsx',
    presets: [
      ['@babel/preset-env', { modules: false }],
      ['@babel/preset-react', { runtime: 'classic' }],
    ],
    compact: true,
    minified: true,
    comments: false,
  });

  if (!result?.code) {
    throw new Error('Babel returned no compiled application code.');
  }

  return result.code;
}

function hardenHtml(html) {
  let optimizedHtml = html;

  optimizedHtml = optimizedHtml.replace(/'unsafe-eval'\s*/g, '');
  optimizedHtml = optimizedHtml.replace(
    /,"https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"/,
    ''
  );
  optimizedHtml = optimizedHtml.replace(/const C="jules-v\d+";/g, 'const C="jules-v6";');
  optimizedHtml = optimizedHtml.replace(
    /onload="__splashMsg\('LOADING RENDERER[^']*'\+__splashElapsed\(\),30\)"/,
    `onload="__splashMsg('LOADING RENDERER…','react-dom · '+__splashElapsed(),60)"`
  );
  optimizedHtml = optimizedHtml.replace(
    /onload="__splashMsg\('WAITING FOR UI[^']*'\+__splashElapsed\(\),60\)"/,
    `onload="__splashMsg('MOUNTING APP…','building component tree · '+__splashElapsed(),90)"`
  );
  optimizedHtml = optimizedHtml.replace(
    /script-src 'self' 'unsafe-inline' https:\/\/unpkg\.com/g,
    "script-src 'self' 'unsafe-inline' https://unpkg.com/react@18/umd/react.production.min.js https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
  );

  return optimizedHtml;
}

async function build() {
  try {
    console.log('🔨 Building Jules Mobile for production...');

    const indexPath = path.join(__dirname, 'index.html');
    const htmlTemplate = fs.readFileSync(indexPath, 'utf-8');

    if (!htmlTemplate.includes(APP_PLACEHOLDER)) {
      throw new Error(`Could not find ${APP_PLACEHOLDER} in index.html.`);
    }

    const sourceFiles = readSourceManifest();
    console.log(`  -> Reading ${sourceFiles.length} source modules...`);
    const source = readAppSource(sourceFiles);

    console.log('  -> Transpiling JSX...');
    const compiledApp = await transpileApp(source);

    const optimizedHtml = hardenHtml(
      htmlTemplate.replace(APP_PLACEHOLDER, compiledApp)
    );

    if (/type="text\/babel"|@babel\/standalone/.test(optimizedHtml)) {
      throw new Error('Production output still contains runtime Babel references.');
    }

    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const outputPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outputPath, optimizedHtml, 'utf-8');

    console.log('✅ Build complete!');
    console.log('📁 Output: dist/index.html');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
