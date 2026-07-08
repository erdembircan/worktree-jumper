import { styleText } from 'node:util';
import { describe, expect, it } from 'vitest';
import { StyleTextColorizer } from '#ui/StyleTextColorizer.js';

const paint = (format: 'cyan' | 'blue' | 'magenta' | 'yellow', text: string) =>
  styleText(format, text, { validateStream: false });

describe('StyleTextColorizer', () => {
  describe('when enabled', () => {
    const colorizer = new StyleTextColorizer(true);

    it('paints a branch name cyan', () => {
      expect(colorizer.branch('master')).toBe(paint('cyan', 'master'));
    });
    it('paints a path blue', () => {
      expect(colorizer.path('~/repo')).toBe(paint('blue', '~/repo'));
    });
    it('paints a commit sha magenta', () => {
      expect(colorizer.commit('abcdef1')).toBe(paint('magenta', 'abcdef1'));
    });
    it('paints a marker yellow', () => {
      expect(colorizer.marker('(current)')).toBe(paint('yellow', '(current)'));
    });
    it('gives each role a distinct color', () => {
      const painted = new Set([
        colorizer.branch('x'),
        colorizer.path('x'),
        colorizer.commit('x'),
        colorizer.marker('x'),
      ]);
      expect(painted.size).toBe(4);
    });
  });

  describe('when disabled', () => {
    const colorizer = new StyleTextColorizer(false);

    it('returns every role unchanged', () => {
      expect(colorizer.branch('master')).toBe('master');
      expect(colorizer.path('~/repo')).toBe('~/repo');
      expect(colorizer.commit('abcdef1')).toBe('abcdef1');
      expect(colorizer.marker('(current)')).toBe('(current)');
    });
  });
});
