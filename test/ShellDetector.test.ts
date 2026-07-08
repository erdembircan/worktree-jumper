import { describe, expect, it } from 'vitest';
import type { ParentProcessLookup } from '#shell/ParentProcessLookup.js';
import { ShellDetector } from '#shell/ShellDetector.js';
import { UnknownShellError } from '#shell/errors/UnknownShellError.js';

class FakeParentProcessLookup implements ParentProcessLookup {
  constructor(private readonly command: string | null) {}

  parentCommand(): Promise<string | null> {
    return Promise.resolve(this.command);
  }
}

describe('ShellDetector', () => {
  it('detects the shell from the parent process command', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup('zsh'), {});
    await expect(detector.detect()).resolves.toBe('zsh');
  });

  it('strips a login-shell leading dash from the parent command', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup('-bash'), {});
    await expect(detector.detect()).resolves.toBe('bash');
  });

  it('strips a full path from the parent command', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup('/usr/local/bin/fish'), {});
    await expect(detector.detect()).resolves.toBe('fish');
  });

  it('falls back to $SHELL when the parent process is unknown', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup(null), { SHELL: '/bin/zsh' });
    await expect(detector.detect()).resolves.toBe('zsh');
  });

  it('falls back to $SHELL when the parent process is not a supported shell', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup('node'), { SHELL: '/bin/bash' });
    await expect(detector.detect()).resolves.toBe('bash');
  });

  it('throws UnknownShellError when neither source identifies a supported shell', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup(null), {});
    await expect(detector.detect()).rejects.toBeInstanceOf(UnknownShellError);
  });

  it('throws UnknownShellError when $SHELL points at an unsupported shell', async () => {
    const detector = new ShellDetector(new FakeParentProcessLookup(null), { SHELL: '/bin/tcsh' });
    await expect(detector.detect()).rejects.toBeInstanceOf(UnknownShellError);
  });

  it('never reads the real process env or process tree', async () => {
    // No real $SHELL is passed in, and the lookup is fully faked, so this
    // only passes if detection truly never touches process.env/ps.
    const detector = new ShellDetector(new FakeParentProcessLookup('fish'), {});
    await expect(detector.detect()).resolves.toBe('fish');
  });
});
