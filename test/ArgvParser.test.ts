import { describe, expect, it } from 'vitest';
import { ArgvParser } from '../src/cli/ArgvParser.js';
import { UsageError } from '../src/cli/UsageError.js';

describe('ArgvParser', () => {
  const parser = new ArgvParser();

  it('parses no arguments as the jump command', () => {
    expect(parser.parse([])).toEqual({ kind: 'jump' });
  });

  it('parses --version', () => {
    expect(parser.parse(['--version'])).toEqual({ kind: 'version' });
  });

  it('parses --help', () => {
    expect(parser.parse(['--help'])).toEqual({ kind: 'help' });
  });

  it('parses -h', () => {
    expect(parser.parse(['-h'])).toEqual({ kind: 'help' });
  });

  it('parses bare init with no shell and defaults', () => {
    expect(parser.parse(['init'])).toEqual({
      kind: 'init',
      shell: null,
      print: false,
      install: false,
      functionName: 'wtj',
    });
  });

  it('parses init with an explicit shell', () => {
    expect(parser.parse(['init', 'zsh'])).toMatchObject({ kind: 'init', shell: 'zsh' });
  });

  it('parses init --print without a shell', () => {
    expect(parser.parse(['init', '--print'])).toMatchObject({
      kind: 'init',
      shell: null,
      print: true,
    });
  });

  it('parses init <shell> --print', () => {
    expect(parser.parse(['init', 'fish', '--print'])).toMatchObject({
      kind: 'init',
      shell: 'fish',
      print: true,
    });
  });

  it('parses init <shell> --install', () => {
    expect(parser.parse(['init', 'bash', '--install'])).toMatchObject({
      kind: 'init',
      shell: 'bash',
      install: true,
    });
  });

  it('parses --as with a value', () => {
    expect(parser.parse(['init', 'zsh', '--as', 'jump'])).toMatchObject({ functionName: 'jump' });
  });

  it('combines --print, --install, and --as', () => {
    expect(parser.parse(['init', 'zsh', '--print', '--install', '--as', 'jump'])).toEqual({
      kind: 'init',
      shell: 'zsh',
      print: true,
      install: true,
      functionName: 'jump',
    });
  });

  it('rejects an unknown top-level argument', () => {
    expect(() => parser.parse(['bogus'])).toThrow(UsageError);
  });

  it('rejects an unknown shell name', () => {
    expect(() => parser.parse(['init', 'tcsh'])).toThrow(UsageError);
  });

  it('rejects an unknown flag inside init', () => {
    expect(() => parser.parse(['init', 'zsh', '--bogus'])).toThrow(UsageError);
  });

  it('rejects --as with no following value', () => {
    expect(() => parser.parse(['init', 'zsh', '--as'])).toThrow(UsageError);
  });
});
