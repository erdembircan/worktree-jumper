/**
 * Thrown when neither the parent process nor $SHELL identify a supported
 * shell.
 */
export class UnknownShellError extends Error {
  constructor() {
    super('could not detect your shell; pass it explicitly (bash, zsh, or fish)');
    this.name = 'UnknownShellError';
  }
}
