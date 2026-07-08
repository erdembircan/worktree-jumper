import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const BIN_PATH = fileURLToPath(new URL('../../bin/worktree-jumper.js', import.meta.url));

export interface CliResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * Spawns the built `worktree-jumper` binary as a real child process with
 * piped (non-TTY) stdio, the way any non-interactive caller would.
 */
export function runCli(args: string[], options: { cwd?: string } = {}): Promise<CliResult> {
  return new Promise((resolve) => {
    const child = execFile(
      'node',
      [BIN_PATH, ...args],
      { cwd: options.cwd, encoding: 'utf8' },
      (error, stdout, stderr) => {
        const code = (error as { code?: unknown } | null)?.code;
        const exitCode = typeof code === 'number' ? code : error ? 1 : 0;
        resolve({ stdout, stderr, exitCode });
      },
    );
    child.stdin?.end();
  });
}
