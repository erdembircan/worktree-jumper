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
