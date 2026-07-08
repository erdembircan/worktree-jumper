import { describe, expect, it } from 'vitest';
import type { Worktree } from '#git/Worktree.js';
import { PathDisplay } from '#ui/PathDisplay.js';
import { WorktreePresenter } from '#ui/WorktreePresenter.js';
import { FakeColorizer } from './fakes/FakeColorizer.js';

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
  const presenter = new WorktreePresenter(new PathDisplay('/home/erdem'), new FakeColorizer());

  it('labels a normal worktree with its branch name', () => {
    expect(presenter.present(BASE).label).toBe('<branch>master</branch>');
  });

  it('appends "(current)" to the label of the current worktree', () => {
    expect(presenter.present({ ...BASE, isCurrent: true }).label).toBe(
      '<branch>master</branch> <current>(current)</current>',
    );
  });

  it('labels a detached worktree with a short sha', () => {
    const label = presenter.present({
      ...BASE,
      branch: null,
      isDetached: true,
      head: 'abcdef1234567890',
    }).label;
    expect(label).toBe('<marker>detached @</marker> <commit>abcdef1</commit>');
  });

  it('labels a bare worktree "(bare)" regardless of branch', () => {
    expect(presenter.present({ ...BASE, isBare: true }).label).toBe('<marker>(bare)</marker>');
  });

  it('labels a worktree with neither a branch nor detached head by its short sha', () => {
    expect(presenter.present({ ...BASE, branch: null, isDetached: false }).label).toBe(
      '<commit>aaaaaaa</commit>',
    );
  });

  it('presents the ~-abbreviated path as the hint', () => {
    expect(presenter.present(BASE).hint).toBe('<path>~/repo</path>');
  });

  it('carries the original worktree through as the value', () => {
    expect(presenter.present(BASE).value).toBe(BASE);
  });
});
