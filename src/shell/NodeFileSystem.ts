import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import type { FileSystem } from './FileSystem.js';

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
