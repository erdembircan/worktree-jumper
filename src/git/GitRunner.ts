export interface GitRunner {
  /**
   * Runs git with the given argument vector in the given working
   * directory and returns stdout.
   */
  run(args: string[], cwd: string): Promise<string>;
}
