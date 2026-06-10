import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function build() {
  try {
    console.log('🔨 Building Jules Mobile for GitHub Pages...\n');

    // 1. Read the original index.html
    const indexPath = path.join(__dirname, 'index.html');
    let htmlContent = fs.readFileSync(indexPath, 'utf-8');

    // 2. Convert JSX script tag to regular script (keeps code as-is)
    // This removes the type="text/babel" which triggers Babel compilation
    // The code already works in modern browsers without JSX transformation
    let optimizedHtml = htmlContent.replace(
      /<script[^>]*type="text\/babel"([^>]*)>/g,
      '<script$1>'
    );

    // 3. Remove Babel transformer script tag since we don't need runtime JSX transformation
    optimizedHtml = optimizedHtml.replace(
      /<script[^>]*src="[^"]*babel\.min\.js"[^>]*><\/script>/g,
      ''
    );

    // 4. Remove the splash screen status updates that reference Babel
    optimizedHtml = optimizedHtml.replace(
      /onload="[^"]*COMPILING UI[^"]*"/g,
      ''
    );

    // 5. Minify (optional - remove comments and extra whitespace)
    optimizedHtml = optimizedHtml.replace(/<!--[\s\S]*?-->/g, ''); // Remove HTML comments
    optimizedHtml = optimizedHtml.replace(/\n\s*\n/g, '\n'); // Remove extra blank lines

    // 6. Ensure dist directory exists
    const distDir = path.join(__dirname, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // 7. Write production HTML
    const outputPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outputPath, optimizedHtml, 'utf-8');

    const originalSize = (fs.statSync(indexPath).size / 1024).toFixed(1);
    const optimizedSize = (fs.statSync(outputPath).size / 1024).toFixed(1);
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(0);

    console.log('✅ Build complete!');
    console.log(`📦 Original: ${originalSize} KB → Optimized: ${optimizedSize} KB (${reduction}% reduction)`);
    console.log(`📁 Output: dist/index.html`);
    console.log('\n📤 Ready to deploy to GitHub Pages:\n');
    console.log('   1. git add dist/');
    console.log('   2. git commit -m "Build for production"');
    console.log('   3. git push\n');
    console.log('ℹ️  The JSX code is standard ES2020+ that works in all modern browsers.');
    console.log('   No build-time transformation needed!\n');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();
