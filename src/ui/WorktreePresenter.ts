import type { Worktree } from '../git/Worktree.js';
import type { PathDisplay } from './PathDisplay.js';
import type { PresentedWorktree } from './PresentedWorktree.js';

/**
 * Formats worktrees for display in the picker: a label (branch name, or
 * `detached @ <sha>`, or `(bare)`, marked `(current)` when applicable) and
 * a `~`-abbreviated path hint.
 */
export class WorktreePresenter {
  constructor(private readonly pathDisplay: PathDisplay) {}

  present(worktree: Worktree): PresentedWorktree {
    return {
      value: worktree,
      label: this.labelFor(worktree),
      hint: this.pathDisplay.format(worktree.path),
    };
  }

  private labelFor(worktree: Worktree): string {
    let label: string;
    if (worktree.isBare) {
      label = '(bare)';
    } else if (worktree.branch) {
      label = worktree.branch;
    } else if (worktree.isDetached) {
      label = `detached @ ${worktree.head.slice(0, 7)}`;
    } else {
      label = worktree.head.slice(0, 7);
    }
    return worktree.isCurrent ? `${label} (current)` : label;
  }
}
