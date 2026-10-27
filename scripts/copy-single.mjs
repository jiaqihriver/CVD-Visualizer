/**
 * Copies the single-file build to the project root so the visualiser can be
 * opened by double-clicking a single HTML file — no server, no Node, no build.
 */
import { copyFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'dist-single/index.html');
const target = resolve(root, 'CVD-Visualizer.html');

copyFileSync(source, target);
const kb = (statSync(target).size / 1024).toFixed(0);
console.log(`\n\x1b[36m✓ Standalone build ready:\x1b[0m CVD-Visualizer.html (${kb} kB)`);
console.log('  Double-click it to open the visualiser — no server required.\n');
