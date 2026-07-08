import { realpath as fsRealpath } from 'node:fs/promises';
import type { GitRunner } from './GitRunner.js';
import type { Worktree } from './Worktree.js';

const HEADS_PREFIX = 'refs/heads/';

/**
 * Resolves the realpath of a filesystem path, used to normalize worktree
 * paths and the current-directory toplevel before comparing them.
 */
export type RealpathFn = (path: string) => Promise<string>;

async function defaultRealpath(path: string): Promise<string> {
  return fsRealpath(path);
}

function parsePorcelain(raw: string): Omit<Worktree, 'isCurrent'>[] {
  const tokens = raw.split('\0');
  const records: string[][] = [];
  let current: string[] = [];
  for (const token of tokens) {
    if (token === '') {
      if (current.length > 0) {
        records.push(current);
        current = [];
      }
      continue;
    }
    current.push(token);
  }
  if (current.length > 0) {
    records.push(current);
  }

  return records.map((record) => {
    let path = '';
    let head = '';
    let branch: string | null = null;
    let isBare = false;
    let isDetached = false;
    let isLocked = false;

    for (const line of record) {
      if (line.startsWith('worktree ')) {
        path = line.slice('worktree '.length);
      } else if (line.startsWith('HEAD ')) {
        head = line.slice('HEAD '.length);
      } else if (line.startsWith('branch ')) {
        const ref = line.slice('branch '.length);
        branch = ref.startsWith(HEADS_PREFIX) ? ref.slice(HEADS_PREFIX.length) : ref;
      } else if (line === 'bare') {
        isBare = true;
      } else if (line === 'detached') {
        isDetached = true;
      } else if (line === 'locked' || line.startsWith('locked ')) {
        isLocked = true;
      }
      // "prunable" (and any future attribute) is intentionally ignored:
      // it doesn't affect what the picker shows.
    }

    return { path, head, branch, isBare, isDetached, isLocked };
  });
}

/**
 * Lists the worktrees of a git repository by parsing
 * `git worktree list --porcelain -z`, and marks which one contains the
 * current working directory.
 */
export class WorktreeRegistry {
  constructor(
    private readonly git: GitRunner,
    private readonly cwd: string,
    private readonly realpath: RealpathFn = defaultRealpath,
  ) {}

  async list(): Promise<Worktree[]> {
    const raw = await this.git.run(['worktree', 'list', '--porcelain', '-z'], this.cwd);
    const parsed = parsePorcelain(raw);

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
