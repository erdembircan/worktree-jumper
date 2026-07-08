import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';
import { BIN_PATH } from './support/runCli.js';

const execFileAsync = promisify(execFile);

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('which', [command]);
    return true;
  } catch {
    return false;
  }
}

const fishAvailable = await commandExists('fish');

describe('init --print output evaluates in a real shell', () => {
  it('zsh: eval defines a wtj function', async () => {
    const script = `eval "$(node "${BIN_PATH}" init zsh --print)"; typeset -f wtj`;
    const { stdout } = await execFileAsync('zsh', ['-c', script]);

    expect(stdout).toContain('wtj');
  });

  it('bash: eval defines a wtj function', async () => {
    const script = `eval "$(node "${BIN_PATH}" init bash --print)"; type wtj`;
    const { stdout } = await execFileAsync('bash', ['-c', script]);

    expect(stdout).toContain('wtj is a function');
  });

  it.runIf(fishAvailable)('fish: eval defines a wtj function', async () => {
    const script = `eval (node "${BIN_PATH}" init fish --print | string collect); functions -q wtj; and echo defined`;
    const { stdout } = await execFileAsync('fish', ['-c', script]);

    expect(stdout).toContain('defined');
  });
});
