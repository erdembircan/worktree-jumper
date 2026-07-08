import type { Worktree } from '#git/Worktree.js';
import type { PICKER_CANCELLED } from './PickerCancelled.js';

/**
 * What `JumpCommand` depends on. Extracted as an interface (rather than
 * the concrete `Picker` class) so commands can be unit-tested against a
 * fake without ever importing `@clack/prompts`.
 */
export interface WorktreePicker {
  pick(worktrees: Worktree[]): Promise<Worktree | typeof PICKER_CANCELLED>;
}
