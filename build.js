import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as babel from '@babel/core';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  try {
    console.log('🔨 Building Jules Mobile for production...');

    const indexPath = path.join(__dirname, 'index.html');
    let htmlContent = fs.readFileSync(indexPath, 'utf-8');

    // 1. Identify the Babel script block
    const scriptRegex = /<script type="text\/babel" data-presets="env,react">([\s\S]*?)<\/script>/;
    const match = htmlContent.match(scriptRegex);

    if (!match) {
        throw new Error("Could not find the Babel script block to transpile.");
    }

    const jsxCode = match[1];
    
    // 2. Transpile the JSX code
    console.log('  -> Transpiling JSX...');
    // Explicitly target environments that don't support ESM if needed,
    // but mainly ensure we are not outputting imports/exports.
    const result = await babel.transformAsync(jsxCode, {
      presets: [
        ['@babel/preset-env', { modules: false }],
        ['@babel/preset-react', { runtime: 'classic' }]
      ],
      compact: true,
      minified: true,
      comments: false
    });

    // 3. Replace the script tag
    // We remove the type="text/babel" and data-presets
    let optimizedHtml = htmlContent.replace(
      scriptRegex,
      `<script>${result.code}</script>`
    );

    // 4. Remove Babel loader script entirely
    optimizedHtml = optimizedHtml.replace(
      /<script src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"[\s\S]*?><\/script>/,
      ''
    );
    // Cleanup any lingering preconnect
    optimizedHtml = optimizedHtml.replace(/<link rel="preconnect" href="https:\/\/unpkg\.com" crossorigin>/, '');

    // 5. Cleanup splash screen updates and references to Babel/JSX
    // Remove the onload/onerror handlers from the Babel script tag if they weren't caught by the regex above
    optimizedHtml = optimizedHtml.replace(/onload="__splashMsg\('COMPILING UI[^']*'\+__splashElapsed\(\),\d+\)"/g, '');
    optimizedHtml = optimizedHtml.replace(/onerror="handleBootError\('Babel failed to load', event\)"/g, '');
    optimizedHtml = optimizedHtml.replace(/onload="__splashMsg\('LOADING COMPILER[^']*'\+__splashElapsed\(\),\d+\)"/g, '');

    // Remove specific mounting message that references Babel elapsed time
    optimizedHtml = optimizedHtml.replace(
      /if \(window\.__splashMsg\) __splashMsg\("MOUNTING APP[^"]*", "building component tree · " \+ __splashElapsed\(\), \d+\);/,
      ''
    );

    // 6. Remove Babel from Service Worker PRE cache and update Cache Version
    optimizedHtml = optimizedHtml.replace(
      /,"https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"/,
      ''
    );
    // Increment cache version to force update
    optimizedHtml = optimizedHtml.replace(/const C="jules-v\d+";/, 'const C="jules-v5";');

    // 7. Adjust splash screen percentages for faster visual feedback in production
    // Since we skipped Babel loading, we re-map the remaining steps
    optimizedHtml = optimizedHtml.replace(
      /onload="__splashMsg\('LOADING RENDERER[^']*'\+__splashElapsed\(\),30\)"/,
      `onload="__splashMsg('LOADING RENDERER…','react-dom · '+__splashElapsed(),60)"`
    );
    optimizedHtml = optimizedHtml.replace(
      /onload="__splashMsg\('WAITING FOR UI[^']*'\+__splashElapsed\(\),60\)"/,
      `onload="__splashMsg('MOUNTING APP…','building component tree · '+__splashElapsed(),90)"`
    );

    // 8. Final polish: Remove whitespace and comments from the HTML (optional but good)
    // For now, let's just make sure we didn't leave any "text/babel" hints

    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const outputPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outputPath, optimizedHtml, 'utf-8');

    console.log('✅ Build complete!');
    console.log(`📁 Output: dist/index.html`);

  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
