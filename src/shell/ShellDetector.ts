import { basename } from 'node:path';
import type { ParentProcessLookup } from './ParentProcessLookup.js';
import { isShellKind, type ShellKind } from './ShellKind.js';
import { UnknownShellError } from './UnknownShellError.js';

/**
 * Detects the user's shell by walking the parent process first, falling
 * back to the $SHELL environment variable. Both boundaries are injected so
 * detection is fully testable without touching the real process tree or
 * environment.
 */
export class ShellDetector {
  constructor(
    private readonly parentProcessLookup: ParentProcessLookup,
    private readonly env: Readonly<Record<string, string | undefined>>,
  ) {}

  async detect(): Promise<ShellKind> {
    const parentCommand = await this.parentProcessLookup.parentCommand();
    if (parentCommand) {
      const fromParent = this.extractShellKind(parentCommand);
      if (fromParent) {
        return fromParent;
      }
    }

    const fromEnv = this.env.SHELL ? this.extractShellKind(this.env.SHELL) : null;
    if (fromEnv) {
      return fromEnv;
    }

    throw new UnknownShellError();
  }

  private extractShellKind(commandPath: string): ShellKind | null {
    const name = basename(commandPath).replace(/^-/, '');
    return isShellKind(name) ? name : null;
  }
}
