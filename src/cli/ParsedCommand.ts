import type { ShellKind } from '#shell/ShellKind.js';

export type ParsedCommand =
  | { kind: 'jump' }
  | { kind: 'version' }
  | { kind: 'help' }
  | {
      kind: 'init';
      shell: ShellKind | null;
      print: boolean;
      install: boolean;
      functionName: string;
    };
