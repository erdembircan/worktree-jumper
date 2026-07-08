import { describe, expect, it } from 'vitest';
import { runCli } from './support/runCli.js';

describe('worktree-jumper --version', () => {
  it('prints the dev version to stdout and exits 0', async () => {
    const result = await runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe('1.0.0-dev\n');
  });
});
