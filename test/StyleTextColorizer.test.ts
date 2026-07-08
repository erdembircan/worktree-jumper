import { styleText } from 'node:util';
import { describe, expect, it } from 'vitest';
import { StyleTextColorizer } from '#ui/StyleTextColorizer.js';

const paint = (format: Parameters<typeof styleText>[0], text: string) =>
  styleText(format, text, { validateStream: false });

describe('StyleTextColorizer', () => {
  describe('when enabled', () => {
    const colorizer = new StyleTextColorizer(true);

    it('paints a branch name cyan', () => {
      expect(colorizer.branch('master')).toBe(paint('cyan', 'master'));
    });
    it('paints a path yellow', () => {
      expect(colorizer.path('~/repo')).toBe(paint('yellow', '~/repo'));
    });
    it('paints a commit sha magenta', () => {
      expect(colorizer.commit('abcdef1')).toBe(paint('magenta', 'abcdef1'));
    });
    it('paints a marker blue', () => {
      expect(colorizer.marker('(bare)')).toBe(paint('blue', '(bare)'));
    });
    it('paints the current-worktree indicator bold green', () => {
      expect(colorizer.current('(current)')).toBe(paint(['bold', 'green'], '(current)'));
    });
    it('gives each role a distinct color', () => {
      const painted = new Set([
        colorizer.branch('x'),
        colorizer.path('x'),
        colorizer.commit('x'),
        colorizer.marker('x'),
        colorizer.current('x'),
      ]);
      expect(painted.size).toBe(5);
    });
  });

  describe('when disabled', () => {
    const colorizer = new StyleTextColorizer(false);

    it('returns every role unchanged', () => {
      expect(colorizer.branch('master')).toBe('master');
      expect(colorizer.path('~/repo')).toBe('~/repo');
      expect(colorizer.commit('abcdef1')).toBe('abcdef1');
      expect(colorizer.marker('(bare)')).toBe('(bare)');
      expect(colorizer.current('(current)')).toBe('(current)');
    });
  });
});
