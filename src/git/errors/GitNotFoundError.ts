/**
 * Thrown when the `git` executable cannot be found on PATH.
 */
export class GitNotFoundError extends Error {
  constructor() {
    super('git executable not found');
    this.name = 'GitNotFoundError';
  }
}
