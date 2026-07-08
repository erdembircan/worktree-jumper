import { describe, expect, it } from 'vitest';
import { PathDisplay } from '../src/ui/PathDisplay.js';

describe('PathDisplay', () => {
  it('abbreviates a path exactly equal to the home directory to ~', () => {
    const display = new PathDisplay('/home/erdem');
    expect(display.format('/home/erdem')).toBe('~');
  });

  it('abbreviates a path under the home directory to ~/...', () => {
    const display = new PathDisplay('/home/erdem');
    expect(display.format('/home/erdem/.zshrc')).toBe('~/.zshrc');
  });

  it('leaves a path outside the home directory unchanged', () => {
    const display = new PathDisplay('/home/erdem');
    expect(display.format('/etc/hosts')).toBe('/etc/hosts');
  });

  it('does not abbreviate a sibling path that merely shares a prefix', () => {
    const display = new PathDisplay('/home/erdem');
    expect(display.format('/home/erdem2/.zshrc')).toBe('/home/erdem2/.zshrc');
  });

  it('leaves paths unchanged when homeDir is empty', () => {
    const display = new PathDisplay('');
    expect(display.format('/home/erdem/.zshrc')).toBe('/home/erdem/.zshrc');
  });
});
