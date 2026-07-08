#!/usr/bin/env node
import { homedir } from 'node:os';
import process from 'node:process';
import { ArgvParser, UsageError } from './cli/ArgvParser.js';
import { ExecFileGitRunner } from './git/GitRunner.js';
import { WorktreeRegistry } from './git/WorktreeRegistry.js';
import { InitCommand } from './commands/InitCommand.js';
import { JumpCommand } from './commands/JumpCommand.js';
import { NodeFileSystem } from './shell/FileSystem.js';
import { FunctionEmitter, InvalidFunctionNameError } from './shell/FunctionEmitter.js';
import { RcInstaller } from './shell/RcInstaller.js';
import { RcResolver } from './shell/RcResolver.js';
import { PsParentProcessLookup, ShellDetector } from './shell/ShellDetector.js';
import { ShellQuoter } from './shell/ShellQuoter.js';
import { MachineOutput } from './ui/MachineOutput.js';
import { InstallConfirmer, Picker } from './ui/Picker.js';

/**
 * Thrown when the picker is invoked without an interactive stdin/stderr,
 * since a piped/non-TTY session could never respond to the prompt.
 */
class NotInteractiveError extends Error {
  constructor() {
    super('interactive terminal required');
    this.name = 'NotInteractiveError';
  }
}

const USAGE = `Usage: worktree-jumper [command] [options]

Commands:
  (none)                   Show the interactive worktree picker
  init [shell]              Print human-readable setup instructions
  init [shell] --print       Print the shell function source (for eval)
  init <shell> --install     Install the eval line into your shell's rc file

Options:
  --as <name>   Name of the emitted shell function (default: wtj)
  --version     Print the version number
  --help, -h    Show this help
`;

const stdout = new MachineOutput(process.stdout);
const stderr = new MachineOutput(process.stderr);

/**
 * Parses argv and dispatches to the requested command, returning the
 * process exit code.
 */
async function main(): Promise<number> {
  const command = new ArgvParser().parse(process.argv.slice(2));

  if (command.kind === 'version') {
    stdout.write(`${__VERSION__}\n`);
    return 0;
  }

  if (command.kind === 'help') {
    stdout.write(USAGE);
    return 0;
  }

  if (command.kind === 'jump') {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      throw new NotInteractiveError();
    }

    const registry = new WorktreeRegistry(new ExecFileGitRunner(), process.cwd());
    const picker = new Picker({
      output: process.stderr,
      input: process.stdin,
      version: __VERSION__,
      homeDir: homedir(),
    });
    const result = await new JumpCommand(registry, picker, stdout).run();
    return result.status === 'cancelled' ? 130 : 0;
  }

  const init = new InitCommand(
    new ShellDetector(new PsParentProcessLookup(), process.env),
    new FunctionEmitter(),
    new ShellQuoter(),
    new RcResolver(process.env),
    new RcInstaller(new NodeFileSystem()),
    new InstallConfirmer({ output: process.stderr, input: process.stdin }),
    stdout,
    stderr,
    homedir(),
  );
  const result = await init.run({
    shell: command.shell,
    print: command.print,
    install: command.install,
    functionName: command.functionName,
  });
  return result.status === 'cancelled' ? 130 : 0;
}

function exitCodeFor(error: unknown): number {
  if (error instanceof UsageError || error instanceof InvalidFunctionNameError) {
    return 2;
  }
  return 1;
}

function messageFor(error: unknown): string {
  if (error instanceof Error) {
    return `worktree-jumper: ${error.message}`;
  }
  return 'worktree-jumper: unknown error';
}

main()
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch((error: unknown) => {
    // Top-level catch: no stack trace, and nothing else, ever reaches
    // stdout. Errors are reported on stderr only.
    process.exitCode = exitCodeFor(error);
    stderr.write(`${messageFor(error)}\n`);
  });
