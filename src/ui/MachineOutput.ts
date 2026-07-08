import type { Writer } from './Writer.js';

/**
 * Writes to a real writable stream (stdout in production).
 */
export class MachineOutput implements Writer {
  constructor(private readonly stream: NodeJS.WritableStream) {}

  write(text: string): void {
    this.stream.write(text);
  }
}
