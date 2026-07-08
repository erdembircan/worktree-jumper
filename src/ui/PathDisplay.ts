/**
 * The single path-display domain object: abbreviates a path under the
 * user's home directory to a leading `~`, the way every shell prompt
 * does. Used anywhere a filesystem path is shown to the user (the
 * picker's hints, `init`'s printed rc paths).
 */
export class PathDisplay {
  constructor(private readonly homeDir: string) {}

  format(path: string): string {
    if (this.homeDir.length > 0 && (path === this.homeDir || path.startsWith(`${this.homeDir}/`))) {
      return `~${path.slice(this.homeDir.length)}`;
    }
    return path;
  }
}
