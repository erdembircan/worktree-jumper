/**
 * Thrown when the picker is invoked without an interactive stdin/stderr,
 * since a piped/non-TTY session could never respond to the prompt.
 */
export class NotInteractiveError extends Error {
  constructor() {
    super('interactive terminal required');
    this.name = 'NotInteractiveError';
  }
}
