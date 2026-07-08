const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Thrown when a requested shell function name fails the identifier
 * allowlist.
 */
export class InvalidFunctionNameError extends Error {
  constructor(name: string) {
    super(`invalid function name "${name}": must match ${NAME_PATTERN}`);
    this.name = 'InvalidFunctionNameError';
  }
}
