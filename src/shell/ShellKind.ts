export type ShellKind = 'bash' | 'zsh' | 'fish';

const SHELL_KINDS: readonly ShellKind[] = ['bash', 'zsh', 'fish'];

export function isShellKind(value: string): value is ShellKind {
  return (SHELL_KINDS as readonly string[]).includes(value);
}

/**
 * Parses a shell name into a {@link ShellKind}, returning `null` when the
 * value isn't one of the supported shells.
 */
export function parseShellKind(value: string): ShellKind | null {
  return isShellKind(value) ? value : null;
}
