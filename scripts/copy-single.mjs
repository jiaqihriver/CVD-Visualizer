/**
 * Copies the single-file build to the project root so the visualiser can be
 * opened by double-clicking a single HTML file — no server, no Node, no build.
 */
import { copyFileSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'dist-single/index.html');

/* 1. standalone file for double-click use */
const standalone = resolve(root, 'CVD-Visualizer.html');
copyFileSync(source, standalone);

/* 2. GitHub Pages entry (Settings → Pages → main /docs) */
const docs = resolve(root, 'docs');
mkdirSync(docs, { recursive: true });
copyFileSync(source, resolve(docs, 'index.html'));
writeFileSync(resolve(docs, '.nojekyll'), '');

const kb = (statSync(standalone).size / 1024).toFixed(0);
console.log(`\n\x1b[36m✓ Standalone build ready:\x1b[0m CVD-Visualizer.html (${kb} kB)`);
console.log('  Also copied to docs/index.html for GitHub Pages.');
console.log('  Double-click the standalone file to run — no server required.\n');
