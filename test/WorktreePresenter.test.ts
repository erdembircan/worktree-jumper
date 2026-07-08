import { describe, expect, it } from 'vitest';
import type { Worktree } from '#git/Worktree.js';
import { PathDisplay } from '#ui/PathDisplay.js';
import { WorktreePresenter } from '#ui/WorktreePresenter.js';

const BASE: Worktree = {
  path: '/home/erdem/repo',
  head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  branch: 'master',
  isBare: false,
  isDetached: false,
  isLocked: false,
  isCurrent: false,
};

describe('WorktreePresenter', () => {
  const presenter = new WorktreePresenter(new PathDisplay('/home/erdem'));

  it('labels a normal worktree with its branch name', () => {
    expect(presenter.present(BASE).label).toBe('master');
  });

  it('appends "(current)" to the label of the current worktree', () => {
    expect(presenter.present({ ...BASE, isCurrent: true }).label).toBe('master (current)');
  });

  it('labels a detached worktree with a short sha', () => {
    const label = presenter.present({
      ...BASE,
      branch: null,
      isDetached: true,
      head: 'abcdef1234567890',
    }).label;
    expect(label).toBe('detached @ abcdef1');
  });

  it('labels a bare worktree "(bare)" regardless of branch', () => {
    expect(presenter.present({ ...BASE, isBare: true }).label).toBe('(bare)');
  });

  it('presents the ~-abbreviated path as the hint', () => {
    expect(presenter.present(BASE).hint).toBe('~/repo');
  });

  it('carries the original worktree through as the value', () => {
    expect(presenter.present(BASE).value).toBe(BASE);
  });
});
