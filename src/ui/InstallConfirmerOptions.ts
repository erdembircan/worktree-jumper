import type { Readable, Writable } from 'node:stream';

export interface InstallConfirmerOptions {
  output: Writable;
  input: Readable;
}
