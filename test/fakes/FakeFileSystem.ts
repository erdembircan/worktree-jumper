import { dirname } from 'node:path';
import type { FileSystem } from '../../src/shell/FileSystem.js';

/**
 * An in-memory `FileSystem` fake for exercising `RcInstaller` without
 * touching the real disk.
 */
export class FakeFileSystem implements FileSystem {
  private readonly files = new Map<string, string>();
  private readonly dirs = new Set<string>();

  constructor(initialFiles: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initialFiles)) {
      this.files.set(path, content);
    }
  }

  exists(path: string): Promise<boolean> {
    return Promise.resolve(this.files.has(path));
  }

  readFile(path: string): Promise<string> {
    const content = this.files.get(path);
    if (content === undefined) {
      return Promise.reject(new Error(`FakeFileSystem: no such file "${path}"`));
    }
    return Promise.resolve(content);
  }

  writeFile(path: string, content: string): Promise<void> {
    this.files.set(path, content);
    return Promise.resolve();
  }

  mkdir(path: string): Promise<void> {
    this.dirs.add(path);
    return Promise.resolve();
  }

  /** Test helper: read back what's currently at `path`, or `null`. */
  fileAt(path: string): string | null {
    return this.files.get(path) ?? null;
  }

  /** Test helper: whether `mkdir` was called for `path` or an ancestor. */
  hasDir(path: string): boolean {
    return this.dirs.has(path) || this.dirs.has(dirname(path));
  }
}
