import type { ShellKind } from './ShellKind.js';

/**
 * The single audited quoting component for values interpolated into
 * emitted shell code. Every dynamic value entering a shell function body
 * or an rc file must pass through {@link ShellQuoter.quote}.
 */
export class ShellQuoter {
  /**
   * Quotes a raw string so it is safe to splice into shell source for the
   * given shell dialect, returning a single shell "word" including its
   * surrounding quotes.
   */
  quote(shell: ShellKind, value: string): string {
    switch (shell) {
      case 'bash':
      case 'zsh':
        return this.quotePosix(value);
      case 'fish':
        return this.quoteFish(value);
    }
  }

  /**
   * POSIX single-quoting: wrap in single quotes, and turn every embedded
   * single quote into `'\''` (close quote, escaped quote, reopen quote).
   * Safe against `$()`, backticks, `$vars`, newlines, and backslashes,
   * since nothing is interpreted inside single quotes.
   */
  private quotePosix(value: string): string {
    return `'${value.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Fish single-quoting: inside single quotes fish only treats `\'` and
   * `\\` as escapes, so both must be escaped; everything else
   * (`$`, backticks, newlines) is literal.
   */
  private quoteFish(value: string): string {
    const escaped = value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    return `'${escaped}'`;
  }
}
