import type { Worktree } from '#git/Worktree.js';
import type { Colorizer } from './Colorizer.js';
import type { PathDisplay } from './PathDisplay.js';
import type { PresentedWorktree } from './PresentedWorktree.js';

/**
 * Formats worktrees for display in the picker: a label (branch name, or
 * `detached @ <sha>`, or `(bare)`, marked `(current)` when applicable) and
 * a `~`-abbreviated path hint. Each kind of information — branch, path,
 * commit sha, and status markers — is given its own color via the injected
 * `Colorizer` so the listing is scannable at a glance.
 */
export class WorktreePresenter {
  constructor(
    private readonly pathDisplay: PathDisplay,
    private readonly colorizer: Colorizer,
  ) {}

  present(worktree: Worktree): PresentedWorktree {
    return {
      value: worktree,
      label: this.labelFor(worktree),
      hint: this.colorizer.path(this.pathDisplay.format(worktree.path)),
    };
  }

  private labelFor(worktree: Worktree): string {
    let label: string;
    if (worktree.isBare) {
      label = this.colorizer.marker('(bare)');
    } else if (worktree.branch) {
      label = this.colorizer.branch(worktree.branch);
    } else if (worktree.isDetached) {
      label = `${this.colorizer.marker('detached @')} ${this.colorizer.commit(worktree.head.slice(0, 7))}`;
    } else {
      label = this.colorizer.commit(worktree.head.slice(0, 7));
    }
    return worktree.isCurrent ? `${label} ${this.colorizer.current('(current)')}` : label;
  }
}
