import { PassThrough } from 'node:stream';
import { describe, expect, it } from 'vitest';
import type { Worktree } from '#git/Worktree.js';
import { PathDisplay } from '#ui/PathDisplay.js';
import { Picker } from '#ui/Picker.js';
import { WorktreePresenter } from '#ui/WorktreePresenter.js';

const MASTER: Worktree = {
  path: '/home/user/repo',
  head: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  branch: 'master',
  isBare: false,
  isDetached: false,
  isLocked: false,
  isCurrent: true,
};
const FEATURE: Worktree = {
  ...MASTER,
  path: '/home/user/repo/wt/x',
  branch: 'feature/x',
  isCurrent: false,
};

// The escape character is built at runtime (rather than written as a
// literal control-character escape in a regex) so the pattern below
// isn't a control-character regex literal.
const ESC = String.fromCharCode(0x1b);
const ANSI_PATTERN = new RegExp(`${ESC}\\[[0-9;?]*[A-Za-z]`, 'g');

/** Strips ANSI escape sequences so assertions run against plain text. */
function stripAnsi(text: string): string {
  return text.replace(ANSI_PATTERN, '');
}

describe('Picker', () => {
  it('renders a blank line between the prompt and the option list', async () => {
    const output = new PassThrough();
    let captured = '';
    output.on('data', (chunk) => {
      captured += chunk.toString();
    });

    const input = new PassThrough() as PassThrough & { isTTY: boolean; setRawMode: () => void };
    input.isTTY = true;
    input.setRawMode = () => {};

    const picker = new Picker(
      { output, input, version: '1.2.3' },
      new WorktreePresenter(new PathDisplay('/home/user')),
    );

    const pending = picker.pick([MASTER, FEATURE]);

    // Wait until both options have rendered, then submit the initial selection.
    const deadline = Date.now() + 2000;
    while (!captured.includes('feature/x')) {
      if (Date.now() > deadline) throw new Error('picker did not render in time');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    input.emit('keypress', '', { name: 'return' });
    await pending;

    const lines = stripAnsi(captured).split('\n');
    const promptIndex = lines.findIndex((line) => line.includes('Select a worktree'));
    const optionIndex = lines.findIndex(
      (line, index) => index > promptIndex && line.includes('master (current)'),
    );
    expect(promptIndex).toBeGreaterThanOrEqual(0);
    expect(optionIndex).toBeGreaterThan(promptIndex);

    // At least one line strictly between them is a blank guide line: just
    // the vertical bar clack draws to connect prompt and options, with no
    // option text on it.
    const between = lines.slice(promptIndex + 1, optionIndex);
    expect(between.some((line) => /^\s*│\s*$/.test(line))).toBe(true);
  });
});
