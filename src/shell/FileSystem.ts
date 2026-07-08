import { access, mkdir, readFile, writeFile } from 'node:fs/promises';

/**
 * The minimal filesystem boundary {@link RcInstaller} needs, so rc-file
 * writes can be exercised against an in-memory fake in unit tests instead
 * of touching the real filesystem.
 */
export interface FileSystem {
  exists(path: string): Promise<boolean>;
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  /** Creates the directory (and any missing parents) if it doesn't exist. */
  mkdir(path: string): Promise<void>;
}

/**
 * Real filesystem access via `node:fs/promises`.
 */
export class NodeFileSystem implements FileSystem {
  async exists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  readFile(path: string): Promise<string> {
    return readFile(path, 'utf8');
  }

  writeFile(path: string, content: string): Promise<void> {
    return writeFile(path, content, 'utf8');
  }

  async mkdir(path: string): Promise<void> {
    await mkdir(path, { recursive: true });
  }
}
