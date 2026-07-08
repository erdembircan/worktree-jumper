import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createFixtureRepo, type FixtureRepo } from './support/fixtureRepo.js';
import { runCli } from './support/runCli.js';

describe('error paths', () => {
  describe('not a git repository', () => {
    let emptyDir: string;

    beforeEach(async () => {
      emptyDir = await mkdtemp(join(tmpdir(), 'worktree-jumper-e2e-empty-'));
    });

    afterEach(async () => {
      await rm(emptyDir, { recursive: true, force: true });
    });

    it('exits non-zero with empty stdout and a non-empty stderr', async () => {
      const result = await runCli([], { cwd: emptyDir });

      expect(result.exitCode).not.toBe(0);
      expect(result.stdout).toBe('');
      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe('non-TTY picker', () => {
    let fixture: FixtureRepo;

    beforeEach(async () => {
      fixture = await createFixtureRepo();
    });

    afterEach(async () => {
      await fixture.cleanup();
    });

    it('exits 1 with empty stdout and mentions an interactive terminal on stderr', async () => {
      const result = await runCli([], { cwd: fixture.repoDir });

      expect(result.exitCode).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('interactive terminal');
    });
  });

  describe('usage errors', () => {
    it('exits 2 for an unknown argument', async () => {
      const result = await runCli(['bogus']);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe('');
    });

    it('exits 2 for init --install without an explicit shell', async () => {
      const result = await runCli(['init', '--install']);

      expect(result.exitCode).toBe(2);
      expect(result.stdout).toBe('');
    });
  });
});
