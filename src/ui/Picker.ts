import { intro, isCancel, select } from '@clack/prompts';
import type { Worktree } from '../git/Worktree.js';
import { PICKER_CANCELLED } from './PickerCancelled.js';
import type { PickerOptions } from './PickerOptions.js';
import type { WorktreePicker } from './WorktreePicker.js';
import type { WorktreePresenter } from './WorktreePresenter.js';

/**
 * Renders the interactive worktree picker via `@clack/prompts`, writing
 * all UI to the injected output stream (stderr in production) so stdout
 * stays reserved for the selected path. Along with `InstallConfirmer`,
 * this is one of only two modules in the codebase that import
 * `@clack/prompts`; every other module depends on the `WorktreePicker`
 * interface instead, so commands stay testable without it.
 */
export class Picker implements WorktreePicker {
  constructor(
    private readonly options: PickerOptions,
    private readonly presenter: WorktreePresenter,
  ) {}

  /**
   * Shows the picker and resolves to the selected worktree, or
   * {@link PICKER_CANCELLED} if the user cancels.
   */
  async pick(worktrees: Worktree[]): Promise<Worktree | typeof PICKER_CANCELLED> {
    const { output, input, version } = this.options;

    intro(`worktree-jumper v${version}`, { output });

    const result = await select<Worktree>({
      message: 'Select a worktree',
      options: worktrees.map((worktree) => this.presenter.present(worktree)),
      initialValue: worktrees.find((worktree) => worktree.isCurrent),
      output,
      input,
    });

    if (isCancel(result)) {
      return PICKER_CANCELLED;
    }
    return result;
  }
}
