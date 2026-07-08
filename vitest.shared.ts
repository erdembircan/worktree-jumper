import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8'));

// Mirrors the "paths" entries in tsconfig.json. tsc and esbuild both read
// tsconfig.json directly; vitest/vite doesn't, so the same mapping is
// repeated here as resolve.alias rather than pulling in a plugin.
const ALIASED_DIRS = ['cli', 'commands', 'git', 'shell', 'ui'];

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: Object.fromEntries(
      ALIASED_DIRS.map((dir) => [`#${dir}`, path.join(rootDir, 'src', dir)]),
    ),
  },
});
