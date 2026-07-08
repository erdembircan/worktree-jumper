import { describe, expect, it } from 'vitest';
import { UsageError } from '../src/cli/ArgvParser.js';
import { InitCommand, type InitCommandInput } from '../src/commands/InitCommand.js';
import { FunctionEmitter } from '../src/shell/FunctionEmitter.js';
import { RcInstaller } from '../src/shell/RcInstaller.js';
import { RcResolver } from '../src/shell/RcResolver.js';
import { ShellDetector, type ParentProcessLookup } from '../src/shell/ShellDetector.js';
import { ShellQuoter } from '../src/shell/ShellQuoter.js';
import { PICKER_CANCELLED } from '../src/ui/Picker.js';
import { FakeConfirmer } from './fakes/FakeConfirmer.js';
import { FakeFileSystem } from './fakes/FakeFileSystem.js';
import { FakeWriter } from './fakes/FakeWriter.js';

class NeverDetected implements ParentProcessLookup {
  parentCommand(): Promise<string | null> {
    return Promise.resolve(null);
  }
}

function baseInput(overrides: Partial<InitCommandInput> = {}): InitCommandInput {
  return { shell: 'zsh', print: false, install: false, functionName: 'wtj', ...overrides };
}

function buildCommand(options: {
  confirmOutcome?: boolean | typeof PICKER_CANCELLED;
  fs?: FakeFileSystem;
  env?: Record<string, string | undefined>;
}) {
  const stdout = new FakeWriter();
  const stderr = new FakeWriter();
  const fs = options.fs ?? new FakeFileSystem();
  const command = new InitCommand(
    new ShellDetector(new NeverDetected(), {}),
    new FunctionEmitter(),
    new ShellQuoter(),
    new RcResolver(options.env ?? { HOME: '/home/erdem' }),
    new RcInstaller(fs),
    new FakeConfirmer(options.confirmOutcome ?? true),
    stdout,
    stderr,
  );
  return { command, stdout, stderr, fs };
}

describe('InitCommand', () => {
  it('print flow: writes exactly the function source to stdout', async () => {
    const { command, stdout, stderr } = buildCommand({});

    const result = await command.run(baseInput({ print: true }));

    expect(result).toEqual({ status: 'printed' });
    expect(stdout.contents()).toContain('wtj() {');
    expect(stderr.contents()).toBe('');
  });

  it('instructed flow (no flags): writes the eval line and rc path to stderr, nothing to stdout', async () => {
    const { command, stdout, stderr } = buildCommand({});

    const result = await command.run(baseInput());

    expect(result).toEqual({ status: 'instructed' });
    expect(stdout.contents()).toBe('');
    expect(stderr.contents()).toContain('/home/erdem/.zshrc');
    expect(stderr.contents()).toContain('eval "$(worktree-jumper init zsh --print)"');
  });

  it('--install without an explicit shell is a usage error', async () => {
    const { command } = buildCommand({});

    await expect(command.run(baseInput({ shell: null, install: true }))).rejects.toBeInstanceOf(
      UsageError,
    );
  });

  it('--install with confirmation accepted writes the fenced eval line and reports installed', async () => {
    const { command, stderr, fs } = buildCommand({ confirmOutcome: true });

    const result = await command.run(baseInput({ install: true }));

    expect(result).toEqual({ status: 'installed' });
    expect(fs.fileAt('/home/erdem/.zshrc')).toContain('eval "$(worktree-jumper init zsh --print)"');
    expect(stderr.contents()).toContain('installed into /home/erdem/.zshrc');
  });

  it('--install with a custom --as name embeds --as in the persisted eval line', async () => {
    const { command, fs } = buildCommand({ confirmOutcome: true });

    await command.run(baseInput({ install: true, functionName: 'jump' }));

    expect(fs.fileAt('/home/erdem/.zshrc')).toContain("--as 'jump'");
  });

  it('--install for fish writes the guarded source line to the conf.d file', async () => {
    const { command, fs } = buildCommand({ confirmOutcome: true, env: { HOME: '/home/erdem' } });

    const result = await command.run(baseInput({ shell: 'fish', install: true }));

    expect(result).toEqual({ status: 'installed' });
    const content = fs.fileAt('/home/erdem/.config/fish/conf.d/worktree-jumper.fish');
    expect(content).toBe(
      'command -q worktree-jumper; and worktree-jumper init fish --print | source\n',
    );
  });

  it('--install declined (confirm answers No) does not write and reports declined', async () => {
    const { command, stderr, fs } = buildCommand({ confirmOutcome: false });

    const result = await command.run(baseInput({ install: true }));

    expect(result).toEqual({ status: 'declined' });
    expect(fs.fileAt('/home/erdem/.zshrc')).toBeNull();
    expect(stderr.contents()).toContain('installation cancelled');
  });

  it('--install cancelled (Esc/Ctrl-C) does not write and reports cancelled', async () => {
    const { command, fs } = buildCommand({ confirmOutcome: PICKER_CANCELLED });

    const result = await command.run(baseInput({ install: true }));

    expect(result).toEqual({ status: 'cancelled' });
    expect(fs.fileAt('/home/erdem/.zshrc')).toBeNull();
  });

  it('rejects an invalid --as name before writing anything', async () => {
    const { command, stdout, stderr } = buildCommand({});

    await expect(
      command.run(baseInput({ print: true, functionName: 'bad;name' })),
    ).rejects.toThrow();
    expect(stdout.contents()).toBe('');
    expect(stderr.contents()).toBe('');
  });
});
