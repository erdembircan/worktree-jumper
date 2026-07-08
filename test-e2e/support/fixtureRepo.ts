import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface FixtureRepo {
  root: string;
  repoDir: string;
  /** A second, linked worktree whose directory name contains a space. */
  linkedWorktreeDir: string;
  cleanup(): Promise<void>;
}

/**
 * Creates a disposable git repository (with one linked worktree) in a
 * fresh temp directory, for e2e tests that need to exercise the built CLI
 * against a real repo without ever touching this project's own tree.
 */
export async function createFixtureRepo(): Promise<FixtureRepo> {
  const root = await mkdtemp(join(tmpdir(), 'worktree-jumper-e2e-'));
  const repoDir = join(root, 'repo');

  await execFileAsync('git', ['init', '-q', repoDir]);
  await execFileAsync('git', ['-C', repoDir, 'config', 'user.email', 'test@example.com']);
  await execFileAsync('git', ['-C', repoDir, 'config', 'user.name', 'Test User']);
  await execFileAsync('git', [
    '-C',
    repoDir,
    'commit',
    '--allow-empty',
    '-q',
    '-m',
    'initial commit',
  ]);

  const linkedWorktreeDir = join(root, 'linked worktree');
  await execFileAsync('git', [
    '-C',
    repoDir,
    'worktree',
    'add',
    '-q',
    '-b',
    'feature',
    linkedWorktreeDir,
  ]);

  return {
    root,
    repoDir,
    linkedWorktreeDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
