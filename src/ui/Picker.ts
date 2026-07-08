import type { Readable, Writable } from 'node:stream';
import { confirm, intro, isCancel, select } from '@clack/prompts';
import type { Worktree } from '../git/Worktree.js';

/** Returned by {@link Picker.pick} when the user cancels the selection. */
export const PICKER_CANCELLED = Symbol('picker-cancelled');

export interface PickerOptions {
  output: Writable;
  input: Readable;
  /** The version shown in the picker's intro header. */
  version: string;
  /** The current user's home directory, used to abbreviate hints to `~`. */
  homeDir: string;
}

function labelFor(worktree: Worktree): string {
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

function hintFor(worktree: Worktree, homeDir: string): string {
  if (
    homeDir.length > 0 &&
    (worktree.path === homeDir || worktree.path.startsWith(`${homeDir}/`))
  ) {
    return `~${worktree.path.slice(homeDir.length)}`;
  }
  return worktree.path;
}

/**
 * What `JumpCommand` depends on. Extracted as an interface (rather than
 * the concrete `Picker` class) so commands can be unit-tested against a
 * fake without ever importing `@clack/prompts`.
 */
export interface WorktreePicker {
  pick(worktrees: Worktree[]): Promise<Worktree | typeof PICKER_CANCELLED>;
}

/**
 * The only module that imports `@clack/prompts`. Renders the interactive
 * worktree picker, writing all UI to the injected output stream (stderr in
 * production) so stdout stays reserved for the selected path.
 */
export class Picker implements WorktreePicker {
  constructor(private readonly options: PickerOptions) {}

  /**
   * Shows the picker and resolves to the selected worktree, or
   * {@link PICKER_CANCELLED} if the user cancels.
   */
  async pick(worktrees: Worktree[]): Promise<Worktree | typeof PICKER_CANCELLED> {
    const { output, input, version, homeDir } = this.options;

    intro(`worktree-jumper v${version}`, { output });

    const result = await select<Worktree>({
      message: 'Select a worktree',
      options: worktrees.map((worktree) => ({
        value: worktree,
        label: labelFor(worktree),
        hint: hintFor(worktree, homeDir),
      })),
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

export interface InstallConfirmerOptions {
  output: Writable;
  input: Readable;
}

/**
 * What `InitCommand` depends on for its install confirmation, extracted
 * for the same reason as {@link WorktreePicker}.
 */
export interface Confirmer {
  confirm(message: string): Promise<boolean | typeof PICKER_CANCELLED>;
}

/**
 * The other half of this module's clack usage: a yes/no confirmation
 * shown before `init --install` writes to the user's rc file. Lives here,
 * not in the command layer, so `@clack/prompts` is imported from exactly
 * one module.
 */
export class InstallConfirmer implements Confirmer {
  constructor(private readonly options: InstallConfirmerOptions) {}

  async confirm(message: string): Promise<boolean | typeof PICKER_CANCELLED> {
    const result = await confirm({
      message,
      output: this.options.output,
      input: this.options.input,
    });
    if (isCancel(result)) {
      return PICKER_CANCELLED;
    }
    return result;
  }
}
