import type { Writer } from '#ui/Writer.js';

/**
 * An in-memory `Writer` fake so tests can assert exactly what a command
 * wrote, byte for byte, without touching a real stream.
 */
export class FakeWriter implements Writer {
  private chunks: string[] = [];

  write(text: string): void {
    this.chunks.push(text);
  }

  contents(): string {
    return this.chunks.join('');
  }
}
