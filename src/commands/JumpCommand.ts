import type { WorktreeRegistry } from '../git/WorktreeRegistry.js';
import { PICKER_CANCELLED } from '../ui/PickerCancelled.js';
import type { WorktreePicker } from '../ui/WorktreePicker.js';
import type { Writer } from '../ui/Writer.js';

export type JumpResult = { status: 'selected' } | { status: 'cancelled' };

/**
 * Orchestrates the default `worktree-jumper` invocation: lists the
 * repository's worktrees, shows the picker, and writes the selected path
 * to stdout for the shell function to `cd` into.
 */
export class JumpCommand {
  constructor(
    private readonly registry: WorktreeRegistry,
    private readonly picker: WorktreePicker,
    private readonly stdout: Writer,
  ) {}

  async run(): Promise<JumpResult> {
    const worktrees = await this.registry.list();
    const selection = await this.picker.pick(worktrees);

    if (selection === PICKER_CANCELLED) {
      return { status: 'cancelled' };
    }

    this.stdout.write(`${selection.path}\n`);
    return { status: 'selected' };
  }
}
