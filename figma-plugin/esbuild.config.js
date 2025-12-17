const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Build the plugin code (runs in Figma sandbox)
const codeBuild = {
  entryPoints: ['src/code.ts'],
  bundle: true,
  outfile: 'dist/code.js',
  target: 'es2020',
  format: 'iife',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
};

// Build the UI (runs in iframe)
const uiBuild = {
  entryPoints: ['src/ui.tsx'],
  bundle: true,
  outfile: 'dist/ui.js',
  target: 'es2020',
  format: 'iife',
  minify: !isWatch,
  sourcemap: isWatch ? 'inline' : false,
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
  },
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"',
  },
};

// HTML template for UI
const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AI App Builder Sync</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      color: #333;
      background: #fff;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="ui.js"></script>
</body>
</html>`;

async function build() {
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }

  // Write HTML file
  fs.writeFileSync('dist/ui.html', htmlTemplate);

  if (isWatch) {
    // Watch mode
    const codeCtx = await esbuild.context(codeBuild);
    const uiCtx = await esbuild.context(uiBuild);

    await codeCtx.watch();
    await uiCtx.watch();

    console.log('Watching for changes...');
  } else {
    // Single build
    await esbuild.build(codeBuild);
    await esbuild.build(uiBuild);
    console.log('Build complete!');
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
