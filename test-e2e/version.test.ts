import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runCli } from './support/runCli.js';

const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

describe('worktree-jumper --version', () => {
  it('prints the version to stdout and exits 0', async () => {
    const result = await runCli(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toBe(`${version}\n`);
  });
});
