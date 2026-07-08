import type { Worktree } from './Worktree.js';

const HEADS_PREFIX = 'refs/heads/';

/**
 * Parses the NUL-separated output of `git worktree list --porcelain -z`
 * into worktree records. Handles paths containing spaces or embedded
 * newlines, since `-z` leaves them unescaped.
 */
export class PorcelainParser {
  parse(raw: string): Omit<Worktree, 'isCurrent'>[] {
    return this.toRecords(raw).map((record) => this.toWorktree(record));
  }

  private toRecords(raw: string): string[][] {
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
    return records;
  }

  private toWorktree(record: string[]): Omit<Worktree, 'isCurrent'> {
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
  }
}
