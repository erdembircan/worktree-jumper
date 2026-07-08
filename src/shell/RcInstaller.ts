import { dirname } from 'node:path';
import type { FileSystem } from './FileSystem.js';
import type { RcTarget } from './RcResolver.js';

const FENCE_START = '# >>> worktree-jumper >>>';
const FENCE_END = '# <<< worktree-jumper <<<';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const FENCE_PATTERN = new RegExp(
  `${escapeRegExp(FENCE_START)}[\\s\\S]*?${escapeRegExp(FENCE_END)}\\n?`,
);

/**
 * Writes the `init --install` snippet to the resolved rc target,
 * idempotently: a `fenced-append` target gets a marker-fenced block that
 * is replaced in place on re-install rather than duplicated, and a
 * `conf.d-file` target is (re)written wholesale since it's a file this
 * tool owns exclusively.
 */
export class RcInstaller {
  constructor(private readonly fs: FileSystem) {}

  async install(target: RcTarget, snippet: string): Promise<void> {
    await this.fs.mkdir(dirname(target.path));

    if (target.kind === 'conf.d-file') {
      await this.fs.writeFile(target.path, snippet);
      return;
    }

    const block = `${FENCE_START}\n${snippet.replace(/\n+$/, '')}\n${FENCE_END}\n`;
    const exists = await this.fs.exists(target.path);
    const existing = exists ? await this.fs.readFile(target.path) : '';

    if (existing.length === 0) {
      await this.fs.writeFile(target.path, block);
      return;
    }

    if (FENCE_PATTERN.test(existing)) {
      await this.fs.writeFile(target.path, existing.replace(FENCE_PATTERN, block));
      return;
    }

    const separator = existing.endsWith('\n') ? '' : '\n';
    await this.fs.writeFile(target.path, `${existing}${separator}\n${block}`);
  }
}
