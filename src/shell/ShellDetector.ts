import { execFile } from 'node:child_process';
import { basename } from 'node:path';
import { isShellKind, type ShellKind } from './ShellKind.js';

/**
 * Thrown when neither the parent process nor $SHELL identify a supported
 * shell.
 */
export class UnknownShellError extends Error {
  constructor() {
    super('could not detect your shell; pass it explicitly (bash, zsh, or fish)');
    this.name = 'UnknownShellError';
  }
}

export interface ParentProcessLookup {
  /**
   * Returns the parent process's command name (e.g. "zsh", "-bash"), or
   * null when it can't be determined.
   */
  parentCommand(): Promise<string | null>;
}

/**
 * Looks up the parent process's command name via `ps -o comm= -p <ppid>`.
 */
export class PsParentProcessLookup implements ParentProcessLookup {
  constructor(private readonly ppid: number = process.ppid) {}

  parentCommand(): Promise<string | null> {
    return new Promise((resolve) => {
      execFile(
        'ps',
        ['-o', 'comm=', '-p', String(this.ppid)],
        { encoding: 'utf8' },
        (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }
          const trimmed = stdout.trim();
          resolve(trimmed.length > 0 ? trimmed : null);
        },
      );
    });
  }
}

function extractShellKind(commandPath: string): ShellKind | null {
  const name = basename(commandPath).replace(/^-/, '');
  return isShellKind(name) ? name : null;
}

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
      const fromParent = extractShellKind(parentCommand);
      if (fromParent) {
        return fromParent;
      }
    }

    const fromEnv = this.env.SHELL ? extractShellKind(this.env.SHELL) : null;
    if (fromEnv) {
      return fromEnv;
    }

    throw new UnknownShellError();
  }
}
