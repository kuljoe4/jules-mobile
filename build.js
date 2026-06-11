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
    const result = await babel.transformAsync(jsxCode, {
      presets: ['@babel/preset-env', '@babel/preset-react'],
    });

    // 3. Replace the script tag
    let optimizedHtml = htmlContent.replace(
      scriptRegex,
      `<script>${result.code}</script>`
    );

    // 4. Remove Babel loader script
    optimizedHtml = optimizedHtml.replace(
      /<script src="https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"[^>]*><\/script>/,
      ''
    );

    // 5. Cleanup splash screen updates that reference Babel
    optimizedHtml = optimizedHtml.replace(
      /onload="__splashMsg\('COMPILING UI[^"]*"\)/g,
      ''
    );

    // 6. Remove Babel from Service Worker PRE cache
    optimizedHtml = optimizedHtml.replace(
      /,"https:\/\/unpkg\.com\/@babel\/standalone\/babel\.min\.js"/,
      ''
    );

    // 7. Write production HTML
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
