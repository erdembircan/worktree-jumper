import { execFile } from 'node:child_process';
import type { ParentProcessLookup } from './ParentProcessLookup.js';

/**
 * Looks up the parent process's command name via `ps -o comm= -p <ppid>`.
 */
export class PsParentProcessLookup implements ParentProcessLookup {
  constructor(private readonly ppid: number = process.ppid) {}

  parentCommand(): Promise<string | null> {
    return new Promise((resolve) => {
      execFile(
        'ps',
        ['-o', 'comm=', '-p', String(this.ppid)],
        { encoding: 'utf8' },
        (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }
          const trimmed = stdout.trim();
          resolve(trimmed.length > 0 ? trimmed : null);
        },
      );
    });
  }
}
