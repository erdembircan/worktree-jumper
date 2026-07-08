import { describe, expect, it } from 'vitest';
import { ShellQuoter } from '../src/shell/ShellQuoter.js';

describe('ShellQuoter', () => {
  const quoter = new ShellQuoter();

  describe('bash and zsh (POSIX single-quoting)', () => {
    for (const shell of ['bash', 'zsh'] as const) {
      it(`wraps a plain value in single quotes (${shell})`, () => {
        expect(quoter.quote(shell, 'wtj')).toBe("'wtj'");
      });

      it(`escapes embedded single quotes (${shell})`, () => {
        expect(quoter.quote(shell, "it's")).toBe("'it'\\''s'");
      });

      it(`neutralizes command substitution (${shell})`, () => {
        expect(quoter.quote(shell, '$(rm -rf ~)')).toBe("'$(rm -rf ~)'");
      });

      it(`neutralizes backticks (${shell})`, () => {
        expect(quoter.quote(shell, '`rm -rf ~`')).toBe("'`rm -rf ~`'");
      });

      it(`neutralizes variable expansion (${shell})`, () => {
        expect(quoter.quote(shell, '$HOME/$USER')).toBe("'$HOME/$USER'");
      });

      it(`preserves embedded newlines literally (${shell})`, () => {
        expect(quoter.quote(shell, 'line1\nline2')).toBe("'line1\nline2'");
      });

      it(`preserves backslashes literally (${shell})`, () => {
        expect(quoter.quote(shell, 'C:\\path\\to\\thing')).toBe("'C:\\path\\to\\thing'");
      });
    }
  });

  describe('fish', () => {
    it('wraps a plain value in single quotes', () => {
      expect(quoter.quote('fish', 'wtj')).toBe("'wtj'");
    });

    it('escapes embedded single quotes with a backslash', () => {
      expect(quoter.quote('fish', "it's")).toBe("'it\\'s'");
    });

    it('escapes embedded backslashes', () => {
      expect(quoter.quote('fish', 'a\\b')).toBe("'a\\\\b'");
    });

    it('neutralizes command substitution', () => {
      expect(quoter.quote('fish', '$(rm -rf ~)')).toBe("'$(rm -rf ~)'");
    });

    it('neutralizes variable expansion', () => {
      expect(quoter.quote('fish', '$HOME')).toBe("'$HOME'");
    });

    it('preserves embedded newlines literally', () => {
      expect(quoter.quote('fish', 'line1\nline2')).toBe("'line1\nline2'");
    });
  });
});
