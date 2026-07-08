import type { Worktree } from '#git/Worktree.js';

/** A worktree formatted for display in the picker. */
export interface PresentedWorktree {
  value: Worktree;
  label: string;
  hint: string;
}
