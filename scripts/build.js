import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as esbuild from 'esbuild';

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

await esbuild.build({
  entryPoints: [path.join(rootDir, 'src/index.ts')],
  outfile: path.join(rootDir, 'dist/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['@clack/prompts'],
  // esbuild resolves the "#domain/*" path aliases via tsconfig.json's
  // "paths" field; point at it explicitly rather than relying on
  // discovery, so the alias mapping stays a single source of truth.
  tsconfig: path.join(rootDir, 'tsconfig.json'),
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
});

console.log('build complete');
