/**
 * Applies a distinct color to each kind of information the picker shows,
 * so callers stay declarative about *what* a token is, not *which* color.
 * The concrete StyleTextColorizer decides colors and whether color is on.
 */
export interface Colorizer {
  branch(text: string): string;
  path(text: string): string;
  commit(text: string): string;
  marker(text: string): string;
  current(text: string): string;
}
