/**
 * Thrown for any argv the CLI doesn't recognize: unknown flags, unknown
 * shell names, missing flag values, or an `--install` invocation missing
 * its required explicit shell.
 */
export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UsageError';
  }
}
