import type { Readable, Writable } from 'node:stream';

export interface PickerOptions {
  output: Writable;
  input: Readable;
  /** The version shown in the picker's intro header. */
  version: string;
}
