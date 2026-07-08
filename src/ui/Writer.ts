/**
 * The single stdout writer contract for the whole program. Every other
 * component writes to stderr; nothing else is permitted to touch stdout,
 * so the stdout contract (machine-readable output only) can't be broken
 * by a stray `console.log` elsewhere.
 */
export interface Writer {
  write(text: string): void;
}
