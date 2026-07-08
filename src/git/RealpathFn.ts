/**
 * Resolves the realpath of a filesystem path, used to normalize worktree
 * paths and the current-directory toplevel before comparing them.
 */
export type RealpathFn = (path: string) => Promise<string>;
