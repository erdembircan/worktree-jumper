import { realpath as fsRealpath } from 'node:fs/promises';
import type { GitRunner } from './GitRunner.js';
import { PorcelainParser } from './PorcelainParser.js';
import type { RealpathFn } from './RealpathFn.js';
import type { Worktree } from './Worktree.js';

/**
 * Lists the worktrees of a git repository by parsing
 * `git worktree list --porcelain -z`, and marks which one contains the
 * current working directory.
 */
export class WorktreeRegistry {
  private readonly porcelainParser = new PorcelainParser();

  constructor(
    private readonly git: GitRunner,
    private readonly cwd: string,
    private readonly realpath: RealpathFn = fsRealpath,
  ) {}

  async list(): Promise<Worktree[]> {
    const raw = await this.git.run(['worktree', 'list', '--porcelain', '-z'], this.cwd);
    const parsed = this.porcelainParser.parse(raw);

    const toplevel = (await this.git.run(['rev-parse', '--show-toplevel'], this.cwd)).trim();
    const currentRealpath = await this.safeRealpath(toplevel);

    const worktrees: Worktree[] = [];
    for (const entry of parsed) {
      const entryRealpath = await this.safeRealpath(entry.path);
      worktrees.push({
        ...entry,
        isCurrent: entryRealpath === currentRealpath,
      });
    }
    return worktrees;
  }

  private async safeRealpath(path: string): Promise<string> {
    try {
      return await this.realpath(path);
    } catch {
      return path;
    }
  }
}
