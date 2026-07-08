import { describe, expect, it } from 'vitest';
import { NotAGitRepositoryError } from '../src/git/NotAGitRepositoryError.js';
import { WorktreeRegistry } from '../src/git/WorktreeRegistry.js';
import { FakeGitRunner } from './fakes/FakeGitRunner.js';

function porcelain(records: string[][]): string {
  return records.map((record) => `${record.join('\0')}\0\0`).join('');
}

const identityRealpath = (path: string): Promise<string> => Promise.resolve(path);

describe('WorktreeRegistry', () => {
  it('parses multiple worktrees, shortening branch refs', async () => {
    const raw = porcelain([
      [
        'worktree /repo',
        'HEAD aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'branch refs/heads/master',
      ],
      [
        'worktree /repo-feature',
        'HEAD bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'branch refs/heads/feature/picker',
      ],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repo\n',
    });
    const registry = new WorktreeRegistry(git, '/repo', identityRealpath);

    const trees = await registry.list();

    expect(trees.map((t) => t.branch)).toEqual(['master', 'feature/picker']);
    expect(trees.map((t) => t.path)).toEqual(['/repo', '/repo-feature']);
  });

  it('marks a detached worktree with a null branch and isDetached true', async () => {
    const raw = porcelain([
      [
        'worktree /repo',
        'HEAD aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'branch refs/heads/master',
      ],
      ['worktree /repo-detached', 'HEAD cccccccccccccccccccccccccccccccccccccccc', 'detached'],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repo\n',
    });
    const registry = new WorktreeRegistry(git, '/repo', identityRealpath);

    const trees = await registry.list();
    const detached = trees[1]!;

    expect(detached.branch).toBeNull();
    expect(detached.isDetached).toBe(true);
    expect(detached.head).toBe('cccccccccccccccccccccccccccccccccccccccc');
  });

  it('marks a bare worktree', async () => {
    const raw = porcelain([['worktree /repo-bare', 'bare']]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repo-bare\n',
    });
    const registry = new WorktreeRegistry(git, '/repo-bare', identityRealpath);

    const trees = await registry.list();

    expect(trees[0]!.isBare).toBe(true);
  });

  it('marks a locked worktree', async () => {
    const raw = porcelain([
      [
        'worktree /repo-locked',
        'HEAD dddddddddddddddddddddddddddddddddddddddd',
        'branch refs/heads/locked-branch',
        'locked in use by another process',
      ],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repo-locked\n',
    });
    const registry = new WorktreeRegistry(git, '/repo-locked', identityRealpath);

    const trees = await registry.list();

    expect(trees[0]!.isLocked).toBe(true);
  });

  it('handles worktree paths containing spaces and embedded newlines', async () => {
    const raw = porcelain([
      [
        'worktree /repos/my project',
        'HEAD eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        'branch refs/heads/master',
      ],
      [
        'worktree /repos/weird\nname',
        'HEAD ffffffffffffffffffffffffffffffffffffffff',
        'branch refs/heads/weird',
      ],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repos/my project\n',
    });
    const registry = new WorktreeRegistry(git, '/repos/my project', identityRealpath);

    const trees = await registry.list();

    expect(trees[0]!.path).toBe('/repos/my project');
    expect(trees[1]!.path).toBe('/repos/weird\nname');
  });

  it('marks exactly the worktree containing the current directory as current', async () => {
    const raw = porcelain([
      [
        'worktree /repo',
        'HEAD aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'branch refs/heads/master',
      ],
      [
        'worktree /repo-feature',
        'HEAD bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'branch refs/heads/feature',
      ],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/repo-feature\n',
    });
    const registry = new WorktreeRegistry(git, '/repo-feature', identityRealpath);

    const trees = await registry.list();

    expect(trees.map((t) => t.isCurrent)).toEqual([false, true]);
  });

  it('normalizes paths through the injected realpath before comparing current', async () => {
    const raw = porcelain([
      [
        'worktree /var/repo',
        'HEAD aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'branch refs/heads/master',
      ],
    ]);
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': raw,
      'rev-parse --show-toplevel': '/tmp/repo\n',
    });
    const realpath = (path: string): Promise<string> =>
      Promise.resolve(path.replace('/tmp/', '/var/').replace(/\/$/, ''));
    const registry = new WorktreeRegistry(git, '/tmp/repo', realpath);

    const trees = await registry.list();

    expect(trees[0]!.isCurrent).toBe(true);
  });

  it('throws NotAGitRepositoryError when git reports we are not in a repository', async () => {
    const git = new FakeGitRunner({
      'worktree list --porcelain -z': new NotAGitRepositoryError(),
    });
    const registry = new WorktreeRegistry(git, '/not-a-repo', identityRealpath);

    await expect(registry.list()).rejects.toBeInstanceOf(NotAGitRepositoryError);
  });
});
