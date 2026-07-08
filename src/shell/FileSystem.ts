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
