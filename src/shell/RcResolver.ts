import { join } from 'node:path';
import type { ShellKind } from './ShellKind.js';

/**
 * How {@link RcInstaller} should write to the resolved path: append (or
 * replace) a fenced block inside an existing rc file, or manage the whole
 * file as a dedicated conf.d snippet.
 */
export type RcTargetKind = 'fenced-append' | 'conf.d-file';

export interface RcTarget {
  path: string;
  kind: RcTargetKind;
}

/**
 * Resolves the shell config file `init --install` should write to, purely
 * from an injected environment — never reads `process.env` directly, so
 * tests never depend on the runner machine's actual $HOME/$ZDOTDIR/
 * $XDG_CONFIG_HOME.
 */
export class RcResolver {
  constructor(private readonly env: Readonly<Record<string, string | undefined>>) {}

  resolve(shell: ShellKind): RcTarget {
    switch (shell) {
      case 'zsh': {
        const dir = this.env.ZDOTDIR ?? this.env.HOME ?? '';
        return { path: join(dir, '.zshrc'), kind: 'fenced-append' };
      }
      case 'bash': {
        const home = this.env.HOME ?? '';
        return { path: join(home, '.bashrc'), kind: 'fenced-append' };
      }
      case 'fish': {
        const configDir = this.env.XDG_CONFIG_HOME ?? join(this.env.HOME ?? '', '.config');
        return {
          path: join(configDir, 'fish', 'conf.d', 'worktree-jumper.fish'),
          kind: 'conf.d-file',
        };
      }
    }
  }
}
