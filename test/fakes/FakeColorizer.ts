import type { Colorizer } from '#ui/Colorizer.js';

/**
 * A `Colorizer` fake that wraps text in visible sentinel tags instead of
 * ANSI codes, so tests can assert which role colored which token without
 * depending on specific escape sequences.
 */
export class FakeColorizer implements Colorizer {
  branch(text: string): string {
    return `<branch>${text}</branch>`;
  }
  path(text: string): string {
    return `<path>${text}</path>`;
  }
  commit(text: string): string {
    return `<commit>${text}</commit>`;
  }
  marker(text: string): string {
    return `<marker>${text}</marker>`;
  }
}
