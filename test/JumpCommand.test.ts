import { describe, expect, it } from 'vitest';
import { JumpCommand } from '#commands/JumpCommand.js';
import { NotAGitRepositoryError } from '#git/errors/NotAGitRepositoryError.js';
import { WorktreeRegistry } from '#git/WorktreeRegistry.js';
import type { Worktree } from '#git/Worktree.js';
import { FakeGitRunner } from './fakes/FakeGitRunner.js';
import { pickerCancelling, pickerSelecting } from './fakes/FakePicker.js';
import { FakeWriter } from './fakes/FakeWriter.js';

const WORKTREE: Worktree = {
  path: '/repos/app/.claude/worktrees/picker',
  head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  branch: 'picker',
  isBare: false,
  isDetached: false,
  isLocked: false,
  isCurrent: false,
};

function registryListing(...worktrees: Worktree[]): WorktreeRegistry {
  const porcelain = worktrees
    .map((w) => `worktree ${w.path}\0HEAD ${w.head}\0branch refs/heads/${w.branch}\0\0`)
    .join('');
  const git = new FakeGitRunner({
    'worktree list --porcelain -z': porcelain,
    'rev-parse --show-toplevel': `${worktrees[0]?.path ?? '/repo'}\n`,
  });
  return new WorktreeRegistry(git, '/repo', (p) => Promise.resolve(p));
}

describe('JumpCommand', () => {
  it('prints only the selected path to stdout, terminated by a newline', async () => {
    const stdout = new FakeWriter();
    const command = new JumpCommand(registryListing(WORKTREE), pickerSelecting(WORKTREE), stdout);

    await command.run();

    expect(stdout.contents()).toBe('/repos/app/.claude/worktrees/picker\n');
  });

  it('returns a selected status on success', async () => {
    const stdout = new FakeWriter();
    const command = new JumpCommand(registryListing(WORKTREE), pickerSelecting(WORKTREE), stdout);

    await expect(command.run()).resolves.toEqual({ status: 'selected' });
  });

  it('writes nothing to stdout and reports cancelled when the picker is cancelled', async () => {
    const stdout = new FakeWriter();
    const command = new JumpCommand(registryListing(WORKTREE), pickerCancelling(), stdout);

    const result = await command.run();

    expect(stdout.contents()).toBe('');
    expect(result).toEqual({ status: 'cancelled' });
  });

  it('propagates NotAGitRepositoryError without writing to stdout', async () => {
    const stdout = new FakeWriter();
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': new NotAGitRepositoryError(),
    });
    const registry = new WorktreeRegistry(git, '/not-a-repo', (p) => Promise.resolve(p));
    const command = new JumpCommand(registry, pickerSelecting(WORKTREE), stdout);

    await expect(command.run()).rejects.toBeInstanceOf(NotAGitRepositoryError);
    expect(stdout.contents()).toBe('');
  });
});
