import { isShellKind, type ShellKind } from '../shell/ShellKind.js';

/** The function name `init` uses when `--as` isn't given. */
export const DEFAULT_FUNCTION_NAME = 'wtj';

/**
 * Thrown for any argv the CLI doesn't recognize: unknown flags, unknown
 * shell names, missing flag values, or an `--install` invocation missing
 * its required explicit shell.
 */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}

export type ParsedCommand =
  | { kind: 'jump' }
  | { kind: 'version' }
  | { kind: 'help' }
  | {
      kind: 'init';
      shell: ShellKind | null;
      print: boolean;
      install: boolean;
      functionName: string;
    };

/**
 * A tiny hand-rolled argv parser (no dependency) that turns the process
 * argument vector into a discriminated-union command description.
 */
export class ArgvParser {
  parse(argv: string[]): ParsedCommand {
    const [first, ...rest] = argv;

    if (first === undefined) {
      return { kind: 'jump' };
    }
    if (first === '--version') {
      return { kind: 'version' };
    }
    if (first === '--help' || first === '-h') {
      return { kind: 'help' };
    }
    if (first === 'init') {
      return this.parseInit(rest);
    }

    throw new UsageError(`unknown argument: ${first}`);
  }

  private parseInit(args: string[]): ParsedCommand {
    let shell: ShellKind | null = null;
    let print = false;
    let install = false;
    let functionName = DEFAULT_FUNCTION_NAME;
    let i = 0;

    const first = args[0];
    if (first !== undefined && !first.startsWith('-')) {
      if (!isShellKind(first)) {
        throw new UsageError(`unknown shell: ${first} (expected bash, zsh, or fish)`);
      }
      shell = first;
      i = 1;
    }

    for (; i < args.length; i++) {
      const arg = args[i];
      if (arg === '--print') {
        print = true;
      } else if (arg === '--install') {
        install = true;
      } else if (arg === '--as') {
        const value = args[i + 1];
        if (value === undefined) {
          throw new UsageError('--as requires a value');
        }
        functionName = value;
        i += 1;
      } else {
        throw new UsageError(`unknown argument: ${arg}`);
      }
    }

    return { kind: 'init', shell, print, install, functionName };
  }
}
