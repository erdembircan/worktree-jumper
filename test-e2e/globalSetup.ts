/**
 * Runs once before the whole e2e suite: builds the CLI so tests can spawn
 * the real built binary as a child process.
 */
export default async function setup(): Promise<void> {
  await import('../scripts/build.js');
}
