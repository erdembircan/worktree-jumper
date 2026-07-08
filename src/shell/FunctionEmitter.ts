import { InvalidFunctionNameError } from './errors/InvalidFunctionNameError.js';
import type { ShellKind } from './ShellKind.js';

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Emits the shell function source that wraps the `worktree-jumper`
 * binary and performs the `cd`. This is what `init --print` writes to
 * stdout for the user's shell to `eval`.
 */
export class FunctionEmitter {
  /**
   * Returns the shell source for a function named `functionName` in the
   * given shell dialect. Throws {@link InvalidFunctionNameError} if the
   * name isn't a safe shell identifier.
   */
  emit(shell: ShellKind, functionName: string): string {
    if (!NAME_PATTERN.test(functionName)) {
      throw new InvalidFunctionNameError(functionName);
    }
    switch (shell) {
      case 'bash':
      case 'zsh':
        return this.emitPosix(functionName);
      case 'fish':
        return this.emitFish(functionName);
    }
  }

  private emitPosix(name: string): string {
    return `${name}() {
  local dir
  dir="$(command worktree-jumper)" || return $?
  [ -n "$dir" ] && cd "$dir"
}
`;
  }

  private emitFish(name: string): string {
    return `function ${name} --description 'Jump to a git worktree'
  set -l dir (command worktree-jumper)
  or return $status
  test -n "$dir"; and cd $dir
end
`;
  }
}
