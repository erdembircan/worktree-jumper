import { execFile } from 'node:child_process';
import { GitCommandError } from './errors/GitCommandError.js';
import { GitNotFoundError } from './errors/GitNotFoundError.js';
import type { GitRunner } from './GitRunner.js';
import { NotAGitRepositoryError } from './errors/NotAGitRepositoryError.js';

/**
 * Executes git as a real child process via `execFile`, never a shell.
 * Argument arrays only — no string interpolation into a command line.
 */
export class ExecFileGitRunner implements GitRunner {
  run(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        'git',
        args,
        { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
        (error, stdout, stderr) => {
          if (error) {
            const code: unknown = (error as { code?: unknown }).code;
            if (code === 'ENOENT') {
              reject(new GitNotFoundError());
              return;
            }
            const exitCode = typeof code === 'number' ? code : null;
            if (exitCode === 128 && /not a git repository/i.test(stderr)) {
              reject(new NotAGitRepositoryError());
              return;
            }
            reject(new GitCommandError(args, exitCode, stderr));
            return;
          }
          resolve(stdout);
        },
      );
    });
  }
}
