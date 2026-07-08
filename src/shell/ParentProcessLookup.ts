export interface ParentProcessLookup {
  /**
   * Returns the parent process's command name (e.g. "zsh", "-bash"), or
   * null when it can't be determined.
   */
  parentCommand(): Promise<string | null>;
}
