import { describe, expect, it } from 'vitest';
import { colorSupported } from '#ui/ColorSupport.js';

describe('colorSupported', () => {
  it('is true for an interactive TTY that reports color', () => {
    expect(colorSupported({ isTTY: true, hasColors: () => true })).toBe(true);
  });
  it('is false when the TTY reports no color (e.g. NO_COLOR)', () => {
    expect(colorSupported({ isTTY: true, hasColors: () => false })).toBe(false);
  });
  it('is false for a non-TTY stream', () => {
    expect(colorSupported({ isTTY: false, hasColors: () => true })).toBe(false);
  });
  it('is false when the stream cannot report color support', () => {
    expect(colorSupported({ isTTY: true })).toBe(false);
  });
  it('is false for an empty stream-like object', () => {
    expect(colorSupported({})).toBe(false);
  });
});
