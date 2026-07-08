import { parseArgs } from 'node:util';
import { isShellKind, type ShellKind } from '#shell/ShellKind.js';
import { DEFAULT_FUNCTION_NAME } from './DefaultFunctionName.js';
import type { ParsedCommand } from './ParsedCommand.js';
import { UsageError } from './errors/UsageError.js';

/**
 * Wraps `node:util`'s `parseArgs` with this CLI's extended behavior:
 * subcommand detection (`init` has its own flag set), the `init <shell>`
 * leading positional, and typed `UsageError`s in place of `parseArgs`'
 * own thrown errors.
 */
export class ArgvParser {
  parse(argv: string[]): ParsedCommand {
    if (argv[0] === 'init') {
      return this.parseInit(argv.slice(1));
    }

    const { values, positionals } = this.runParseArgs(() =>
      parseArgs({
        args: argv,
        options: {
          version: { type: 'boolean' },
          help: { type: 'boolean', short: 'h' },
        },
        allowPositionals: true,
        strict: true,
      }),
    );
    this.rejectExtraPositionals(positionals);

    if (values.version) {
      return { kind: 'version' };
    }
    if (values.help) {
      return { kind: 'help' };
    }
    return { kind: 'jump' };
  }

  private parseInit(args: string[]): ParsedCommand {
    let shell: ShellKind | null = null;
    let rest = args;

    const leading = args[0];
    if (leading !== undefined && !leading.startsWith('-')) {
      if (!isShellKind(leading)) {
        throw new UsageError(`unknown shell: ${leading} (expected bash, zsh, or fish)`);
      }
      shell = leading;
      rest = args.slice(1);
    }

    const { values, positionals } = this.runParseArgs(() =>
      parseArgs({
        args: rest,
        options: {
          print: { type: 'boolean' },
          install: { type: 'boolean' },
          as: { type: 'string' },
        },
        allowPositionals: true,
        strict: true,
      }),
    );
    this.rejectExtraPositionals(positionals);

    return {
      kind: 'init',
      shell,
      print: values.print ?? false,
      install: values.install ?? false,
      functionName: values.as ?? DEFAULT_FUNCTION_NAME,
    };
  }

  private rejectExtraPositionals(positionals: string[]): void {
    if (positionals.length > 0) {
      throw new UsageError(`unknown argument: ${positionals[0]}`);
    }
  }

  /**
   * Runs a `parseArgs` call, converting whatever it throws (unknown
   * option, missing option value, ...) into a {@link UsageError}.
   */
  private runParseArgs<T>(run: () => T): T {
    try {
      return run();
    } catch (error) {
      throw new UsageError(error instanceof Error ? error.message : 'invalid arguments');
    }
  }
}
