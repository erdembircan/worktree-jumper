import { styleText } from 'node:util';
import type { Colorizer } from './Colorizer.js';

/**
 * The only module that turns text into ANSI-colored text, using Node's
 * native `util.styleText` (no color dependency). Whether color is applied
 * is decided once by the caller and passed in as `enabled`; when disabled,
 * every role returns its input unchanged. `validateStream` is turned off
 * because the enable decision — made by `colorSupported` against the
 * picker's stderr — already accounts for TTY / NO_COLOR / FORCE_COLOR.
 */
export class StyleTextColorizer implements Colorizer {
  constructor(private readonly enabled: boolean) {}

  /** Colors a branch name. */
  branch(text: string): string {
    return this.paint(['bold', 'magenta'], text);
  }

  /** Colors a filesystem path. */
  path(text: string): string {
    return this.paint('blue', text);
  }

  /** Colors a short commit SHA. */
  commit(text: string): string {
    return this.paint(['bold', 'cyan'], text);
  }

  /** Colors a status marker such as `(bare)` or `detached @`. */
  marker(text: string): string {
    return this.paint(['bold', 'red'], text);
  }

  /** Colors the current-worktree indicator. */
  current(text: string): string {
    return this.paint(['bold', 'green'], text);
  }

  private paint(format: Parameters<typeof styleText>[0], text: string): string {
    return this.enabled ? styleText(format, text, { validateStream: false }) : text;
  }
}
