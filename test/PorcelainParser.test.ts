import { describe, expect, it } from 'vitest';
import { PorcelainParser } from '#git/PorcelainParser.js';

function porcelain(records: string[][]): string {
  return records.map((record) => `${record.join('\0')}\0\0`).join('');
}

describe('PorcelainParser', () => {
  const parser = new PorcelainParser();

  it('returns an empty array for empty input', () => {
    expect(parser.parse('')).toEqual([]);
  });

  it('parses multiple worktree records, shortening branch refs to their short name', () => {
    const raw = porcelain([
      [
        'worktree /repo',
        'HEAD aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        'branch refs/heads/master',
      ],
      [
        'worktree /repo-feature',
        'HEAD bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        'branch refs/heads/feature/picker',
      ],
    ]);

    const records = parser.parse(raw);

    expect(records.map((r) => r.branch)).toEqual(['master', 'feature/picker']);
    expect(records.map((r) => r.path)).toEqual(['/repo', '/repo-feature']);
    expect(records.map((r) => r.head)).toEqual([
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
  });

  it('marks a detached record with a null branch and isDetached true', () => {
    const raw = porcelain([
      ['worktree /repo-detached', 'HEAD cccccccccccccccccccccccccccccccccccccccc', 'detached'],
    ]);

    const [record] = parser.parse(raw);

    expect(record?.branch).toBeNull();
    expect(record?.isDetached).toBe(true);
  });

  it('marks a bare record', () => {
    const raw = porcelain([['worktree /repo-bare', 'bare']]);

    const [record] = parser.parse(raw);

    expect(record?.isBare).toBe(true);
    expect(record?.isDetached).toBe(false);
  });

  it('marks a locked record regardless of whether a reason is given', () => {
    const withReason = porcelain([
      ['worktree /repo-locked', 'HEAD dddddddddddddddddddddddddddddddddddddddd', 'locked in use'],
    ]);
    const withoutReason = porcelain([
      ['worktree /repo-locked', 'HEAD dddddddddddddddddddddddddddddddddddddddd', 'locked'],
    ]);

    expect(parser.parse(withReason)[0]?.isLocked).toBe(true);
    expect(parser.parse(withoutReason)[0]?.isLocked).toBe(true);
  });

  it('ignores unrecognized attribute lines such as "prunable"', () => {
    const raw = porcelain([
      [
        'worktree /repo-prunable',
        'HEAD eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        'branch refs/heads/master',
        'prunable gitdir file points to non-existent location',
      ],
    ]);

    const [record] = parser.parse(raw);

    expect(record?.path).toBe('/repo-prunable');
    expect(record?.branch).toBe('master');
  });

  it('handles paths containing spaces and embedded newlines', () => {
    const raw = porcelain([
      [
        'worktree /repos/my project',
        'HEAD ffffffffffffffffffffffffffffffffffffffff',
        'branch refs/heads/master',
      ],
      [
        'worktree /repos/weird\nname',
        'HEAD 1111111111111111111111111111111111111111',
        'branch refs/heads/weird',
      ],
    ]);

    const records = parser.parse(raw);

    expect(records[0]?.path).toBe('/repos/my project');
    expect(records[1]?.path).toBe('/repos/weird\nname');
  });
});
