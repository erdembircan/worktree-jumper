import { execFile } from 'node:child_process';

/**
 * Thrown when a git invocation fails because the working directory is not
 * inside a git repository (or any of its worktrees).
 */
export class NotAGitRepositoryError extends Error {
  constructor() {
    super('not a git repository');
    this.name = 'NotAGitRepositoryError';
  }
}

/**
 * Thrown when the `git` executable cannot be found on PATH.
 */
export class GitNotFoundError extends Error {
  constructor() {
    super('git executable not found');
    this.name = 'GitNotFoundError';
  }
}

/**
 * Thrown when git exits non-zero for a reason other than "not a
 * repository".
 */
export class GitCommandError extends Error {
  constructor(
    public readonly args: readonly string[],
    public readonly exitCode: number | null,
    stderr: string,
  ) {
    super(`git ${args.join(' ')} failed: ${stderr.trim()}`);
    this.name = 'GitCommandError';
  }
}

export interface GitRunner {
  /**
   * Runs git with the given argument vector in the given working
   * directory and returns stdout.
   */
  run(args: string[], cwd: string): Promise<string>;
}

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
