import type { GitRunner } from '../../src/git/GitRunner.js';

/**
 * A `GitRunner` fake keyed by the joined argv, so tests can script exact
 * responses (or a rejection) for a specific git invocation without ever
 * spawning real git.
 */
export class FakeGitRunner implements GitRunner {
  constructor(private readonly responses: Record<string, string | Error>) {}

  run(args: string[], _cwd: string): Promise<string> {
    const key = args.join(' ');
    const response = this.responses[key];
    if (response === undefined) {
      throw new Error(`FakeGitRunner: no response configured for "${key}"`);
    }
    if (response instanceof Error) {
      return Promise.reject(response);
    }
    return Promise.resolve(response);
  }
}
