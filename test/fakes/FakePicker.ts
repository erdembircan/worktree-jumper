import type { Worktree } from '#git/Worktree.js';
import { PICKER_CANCELLED } from '#ui/PickerCancelled.js';
import type { WorktreePicker } from '#ui/WorktreePicker.js';

/** A `WorktreePicker` fake that always resolves to the given outcome. */
export class FakePicker implements WorktreePicker {
  constructor(private readonly outcome: Worktree | typeof PICKER_CANCELLED) {}

  pick(): Promise<Worktree | typeof PICKER_CANCELLED> {
    return Promise.resolve(this.outcome);
  }
}

export function pickerSelecting(worktree: Worktree): FakePicker {
  return new FakePicker(worktree);
}

export function pickerCancelling(): FakePicker {
  return new FakePicker(PICKER_CANCELLED);
}
