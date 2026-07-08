import { DEFAULT_FUNCTION_NAME } from '../cli/DefaultFunctionName.js';
import { UsageError } from '../cli/UsageError.js';
import type { FunctionEmitter } from '../shell/FunctionEmitter.js';
import type { RcInstaller } from '../shell/RcInstaller.js';
import type { RcResolver } from '../shell/RcResolver.js';
import type { RcTarget } from '../shell/RcTarget.js';
import type { ShellDetector } from '../shell/ShellDetector.js';
import type { ShellKind } from '../shell/ShellKind.js';
import type { ShellQuoter } from '../shell/ShellQuoter.js';
import type { Confirmer } from '../ui/Confirmer.js';
import type { PathDisplay } from '../ui/PathDisplay.js';
import { PICKER_CANCELLED } from '../ui/PickerCancelled.js';
import type { Writer } from '../ui/Writer.js';

export interface InitCommandInput {
  shell: ShellKind | null;
  print: boolean;
  install: boolean;
  functionName: string;
}

export type InitResult =
  | { status: 'printed' }
  | { status: 'instructed' }
  | { status: 'installed' }
  | { status: 'declined' }
  | { status: 'cancelled' };

/**
 * Orchestrates every `worktree-jumper init` flow: printing the shell
 * function source, printing human-readable setup instructions, and
 * installing the eval line into the user's rc file.
 */
export class InitCommand {
  constructor(
    private readonly shellDetector: ShellDetector,
    private readonly functionEmitter: FunctionEmitter,
    private readonly shellQuoter: ShellQuoter,
    private readonly rcResolver: RcResolver,
    private readonly rcInstaller: RcInstaller,
    private readonly installConfirmer: Confirmer,
    private readonly stdout: Writer,
    private readonly stderr: Writer,
    private readonly pathDisplay: PathDisplay,
  ) {}

  async run(input: InitCommandInput): Promise<InitResult> {
    if (input.install && input.shell === null) {
      throw new UsageError('init --install requires an explicit shell (bash, zsh, or fish)');
    }

    const shell = input.shell ?? (await this.shellDetector.detect());
    // Validates functionName against the identifier allowlist up front,
    // regardless of which flow below actually needs the emitted source.
    const functionSnippet = this.functionEmitter.emit(shell, input.functionName);

    if (input.print) {
      this.stdout.write(functionSnippet);
      return { status: 'printed' };
    }

    const target = this.rcResolver.resolve(shell);
    const evalCommand = this.buildEvalCommand(shell, input.functionName);

    if (!input.install) {
      this.stderr.write(`Add this line to ${target.path}:\n\n  ${evalCommand}\n`);
      return { status: 'instructed' };
    }

    const confirmed = await this.installConfirmer.confirm(
      `Install worktree-jumper into ${target.path}?`,
    );
    if (confirmed === PICKER_CANCELLED) {
      return { status: 'cancelled' };
    }
    if (!confirmed) {
      this.stderr.write('installation cancelled\n');
      return { status: 'declined' };
    }

    const content =
      target.kind === 'conf.d-file'
        ? `${this.buildFishSourceLine(input.functionName)}\n`
        : `${evalCommand}\n`;
    await this.rcInstaller.install(target, content);
    this.stderr.write(`installed into ${target.path}\n${this.activationHint(target)}\n`);
    return { status: 'installed' };
  }

  /**
   * The install writes to an rc file that's only read when a shell
   * starts, so this tells the user how to pick the change up in their
   * *current* shell (or that it isn't needed, for fish).
   */
  private activationHint(target: RcTarget): string {
    if (target.kind === 'conf.d-file') {
      return 'Start a new fish session to activate (conf.d loads automatically).';
    }
    return `Restart your shell or run: source ${this.pathDisplay.format(target.path)}`;
  }

  private buildEvalCommand(shell: ShellKind, functionName: string): string {
    const asFlag = this.asFlag(shell, functionName);
    return `eval "$(worktree-jumper init ${shell} --print${asFlag})"`;
  }

  private buildFishSourceLine(functionName: string): string {
    const asFlag = this.asFlag('fish', functionName);
    return `command -q worktree-jumper; and worktree-jumper init fish --print${asFlag} | source`;
  }

  private asFlag(shell: ShellKind, functionName: string): string {
    if (functionName === DEFAULT_FUNCTION_NAME) {
      return '';
    }
    return ` --as ${this.shellQuoter.quote(shell, functionName)}`;
  }
}
