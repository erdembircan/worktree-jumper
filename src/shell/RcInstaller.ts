import { dirname } from 'node:path';
import type { FileSystem } from './FileSystem.js';
import type { RcTarget } from './RcTarget.js';

const FENCE_START = '# >>> worktree-jumper >>>';
const FENCE_END = '# <<< worktree-jumper <<<';
// Neither marker contains a regex metacharacter, so the pattern below is
// written directly as a literal rather than built from an escaping helper.
const FENCE_PATTERN = /# >>> worktree-jumper >>>[\s\S]*?# <<< worktree-jumper <<<\n?/;

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
