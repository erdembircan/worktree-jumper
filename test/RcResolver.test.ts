import { describe, expect, it } from 'vitest';
import { RcResolver } from '../src/shell/RcResolver.js';

describe('RcResolver', () => {
  it('resolves zsh to $ZDOTDIR/.zshrc when ZDOTDIR is set', () => {
    const resolver = new RcResolver({ ZDOTDIR: '/custom/zdotdir', HOME: '/home/erdem' });
    expect(resolver.resolve('zsh')).toEqual({
      path: '/custom/zdotdir/.zshrc',
      kind: 'fenced-append',
    });
  });

  it('resolves zsh to $HOME/.zshrc when ZDOTDIR is unset', () => {
    const resolver = new RcResolver({ HOME: '/home/erdem' });
    expect(resolver.resolve('zsh')).toEqual({ path: '/home/erdem/.zshrc', kind: 'fenced-append' });
  });

  it('resolves bash to $HOME/.bashrc', () => {
    const resolver = new RcResolver({ HOME: '/home/erdem' });
    expect(resolver.resolve('bash')).toEqual({
      path: '/home/erdem/.bashrc',
      kind: 'fenced-append',
    });
  });

  it('resolves fish to $XDG_CONFIG_HOME/fish/conf.d/worktree-jumper.fish when set', () => {
    const resolver = new RcResolver({ XDG_CONFIG_HOME: '/custom/config', HOME: '/home/erdem' });
    expect(resolver.resolve('fish')).toEqual({
      path: '/custom/config/fish/conf.d/worktree-jumper.fish',
      kind: 'conf.d-file',
    });
  });

  it('resolves fish to $HOME/.config/fish/conf.d/worktree-jumper.fish when XDG_CONFIG_HOME is unset', () => {
    const resolver = new RcResolver({ HOME: '/home/erdem' });
    expect(resolver.resolve('fish')).toEqual({
      path: '/home/erdem/.config/fish/conf.d/worktree-jumper.fish',
      kind: 'conf.d-file',
    });
  });
});
