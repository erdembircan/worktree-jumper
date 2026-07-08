/**
 * A single entry from `git worktree list`, with the current-worktree flag
 * resolved separately by the registry.
 */
export interface Worktree {
  path: string;
  head: string;
  branch: string | null;
  isBare: boolean;
  isDetached: boolean;
  isLocked: boolean;
  isCurrent: boolean;
}
