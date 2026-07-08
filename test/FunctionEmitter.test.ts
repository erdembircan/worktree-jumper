import { describe, expect, it } from 'vitest';
import { FunctionEmitter } from '#shell/FunctionEmitter.js';
import { InvalidFunctionNameError } from '#shell/errors/InvalidFunctionNameError.js';

describe('FunctionEmitter', () => {
  const emitter = new FunctionEmitter();

  it('emits the exact bash function source', () => {
    expect(emitter.emit('bash', 'wtj')).toBe(
      `wtj() {
  local dir
  dir="$(command worktree-jumper)" || return $?
  [ -n "$dir" ] && cd "$dir"
}
`,
    );
  });

  it('emits the exact zsh function source (identical to bash)', () => {
    expect(emitter.emit('zsh', 'wtj')).toBe(emitter.emit('bash', 'wtj'));
  });

  it('emits the exact fish function source', () => {
    expect(emitter.emit('fish', 'wtj')).toBe(
      `function wtj --description 'Jump to a git worktree'
  set -l dir (command worktree-jumper)
  or return $status
  test -n "$dir"; and cd $dir
end
`,
    );
  });

  it('uses a custom function name for bash', () => {
    expect(emitter.emit('bash', 'jump')).toContain('jump() {');
  });

  it('uses a custom function name for fish', () => {
    expect(emitter.emit('fish', 'jump')).toContain('function jump ');
  });

  it('rejects a name containing a semicolon', () => {
    expect(() => emitter.emit('bash', 'bad;name')).toThrow(InvalidFunctionNameError);
  });

  it('rejects a name that looks like a shell command', () => {
    expect(() => emitter.emit('bash', 'rm -rf')).toThrow(InvalidFunctionNameError);
  });

  it('rejects a name starting with a digit', () => {
    expect(() => emitter.emit('bash', '1wtj')).toThrow(InvalidFunctionNameError);
  });

  it('rejects an empty name', () => {
    expect(() => emitter.emit('bash', '')).toThrow(InvalidFunctionNameError);
  });

  it('accepts underscores and digits after the first character', () => {
    expect(() => emitter.emit('bash', '_wtj_2')).not.toThrow();
  });
});
