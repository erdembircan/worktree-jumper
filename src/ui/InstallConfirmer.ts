import { confirm, isCancel } from '@clack/prompts';
import type { Confirmer } from './Confirmer.js';
import type { InstallConfirmerOptions } from './InstallConfirmerOptions.js';
import { PICKER_CANCELLED } from './PickerCancelled.js';

/**
 * A yes/no confirmation, via `@clack/prompts`, shown before
 * `init --install` writes to the user's rc file. Along with `Picker`,
 * this is one of only two modules in the codebase that import
 * `@clack/prompts`; `InitCommand` depends on the `Confirmer` interface
 * instead, so it stays testable without it.
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
