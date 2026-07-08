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
