import { describe, expect, it } from 'vitest';
import { RcInstaller } from '#shell/RcInstaller.js';
import { FakeFileSystem } from './fakes/FakeFileSystem.js';

const SNIPPET = 'eval "$(worktree-jumper init zsh --print)"';
const FENCED_TARGET = { path: '/home/erdem/.zshrc', kind: 'fenced-append' } as const;
const CONFD_TARGET = {
  path: '/home/erdem/.config/fish/conf.d/worktree-jumper.fish',
  kind: 'conf.d-file',
} as const;

describe('RcInstaller', () => {
  it('appends a fenced block to a fresh (missing) file', async () => {
    const fs = new FakeFileSystem();
    const installer = new RcInstaller(fs);

    await installer.install(FENCED_TARGET, SNIPPET);

    const content = fs.fileAt(FENCED_TARGET.path);
    expect(content).toBe(
      '# >>> worktree-jumper >>>\neval "$(worktree-jumper init zsh --print)"\n# <<< worktree-jumper <<<\n',
    );
  });

  it('appends a fenced block to an existing file with unrelated content', async () => {
    const fs = new FakeFileSystem({ '/home/erdem/.zshrc': 'export PATH=$PATH:/usr/local/bin\n' });
    const installer = new RcInstaller(fs);

    await installer.install(FENCED_TARGET, SNIPPET);

    expect(fs.fileAt(FENCED_TARGET.path)).toBe(
      'export PATH=$PATH:/usr/local/bin\n\n' +
        '# >>> worktree-jumper >>>\neval "$(worktree-jumper init zsh --print)"\n# <<< worktree-jumper <<<\n',
    );
  });

  it('replaces the fenced block in place on re-install instead of duplicating it', async () => {
    const fs = new FakeFileSystem();
    const installer = new RcInstaller(fs);

    await installer.install(FENCED_TARGET, SNIPPET);
    await installer.install(FENCED_TARGET, 'eval "$(worktree-jumper init zsh --print --as jump)"');

    const content = fs.fileAt(FENCED_TARGET.path)!;
    expect(content).toBe(
      '# >>> worktree-jumper >>>\neval "$(worktree-jumper init zsh --print --as jump)"\n# <<< worktree-jumper <<<\n',
    );
    expect(content.match(/>>> worktree-jumper >>>/g)).toHaveLength(1);
  });

  it('leaves the rest of the file intact when replacing the fenced block', async () => {
    const existing =
      'export EDITOR=vim\n\n' +
      '# >>> worktree-jumper >>>\neval "$(worktree-jumper init zsh --print)"\n# <<< worktree-jumper <<<\n' +
      '\nexport PAGER=less\n';
    const fs = new FakeFileSystem({ '/home/erdem/.zshrc': existing });
    const installer = new RcInstaller(fs);

    await installer.install(FENCED_TARGET, 'eval "$(worktree-jumper init zsh --print --as jump)"');

    const content = fs.fileAt(FENCED_TARGET.path)!;
    expect(content).toContain('export EDITOR=vim');
    expect(content).toContain('export PAGER=less');
    expect(content).toContain('--as jump');
    expect(content).not.toContain('worktree-jumper init zsh --print"');
  });

  it('creates the missing parent directory before writing', async () => {
    const fs = new FakeFileSystem();
    const installer = new RcInstaller(fs);

    await installer.install(FENCED_TARGET, SNIPPET);

    expect(fs.hasDir(FENCED_TARGET.path)).toBe(true);
  });

  it('writes a conf.d-file target wholesale rather than fencing it', async () => {
    const fs = new FakeFileSystem();
    const installer = new RcInstaller(fs);
    const source = 'command -q worktree-jumper; and worktree-jumper init fish --print | source\n';

    await installer.install(CONFD_TARGET, source);

    expect(fs.fileAt(CONFD_TARGET.path)).toBe(source);
  });

  it('re-installing a conf.d-file target overwrites rather than duplicates', async () => {
    const fs = new FakeFileSystem();
    const installer = new RcInstaller(fs);

    await installer.install(CONFD_TARGET, 'first\n');
    await installer.install(CONFD_TARGET, 'second\n');

    expect(fs.fileAt(CONFD_TARGET.path)).toBe('second\n');
  });
});
