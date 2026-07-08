# CLAUDE.md

## Announce Completion Out Loud

The maintainer is frequently away from the keyboard or tapped out while work runs. Whenever you finish a unit of work — a task, a subtask, a fix, a commit, a pushed PR, anything you'd report as done — **announce it aloud** with the macOS `say` command, in addition to writing the result as text.

- Keep the spoken line short and specific: what got done, and whether checks/CI are green (e.g. `say "Shell detector fixed and pushed, all checks green"`). Don't read out long output.
- Say it at the actual completion point, not before verification finishes — speaking "done" while tests are still running is misleading.
- This is about finishing work; routine progress chatter mid-task doesn't need narration.

## Implementation Plans

`docs/plans/` holds the implementation plans for larger features. **Whenever a task, prompt, or discussion mentions a plan** — "the plan", "the init plan", "implement the plan" — check `docs/plans/` first and read the matching plan document in full before doing anything else. It is the authoritative design for that work: don't ask where the plan is, and don't re-derive or re-litigate decisions the plan already settles.

## Architectural Charts

Charts in `docs/contracts/` are **contracts**, not implementation details. They define the authoritative picture of the application's architecture and the interactions between its modules. Treat them with the same weight as API contracts — they describe what the system is, not how it happens to be built right now.

### Content Rules

Charts show **contracts**, not internals:

- Show only **public APIs** — methods and properties that a class or module exposes to other modules
- **Never** include private methods, internal helpers, or implementation details
- Show **relationships**: associations, dependencies, composition, aggregation
- Show **hierarchy**: inheritance and interface implementation
- Mark **abstractions**: abstract classes and interfaces must be visually distinguished

### Keeping Charts Current

Charts must always reflect the current state of the software. Any change to the codebase that affects architecture, module interactions, data flow, or use case behavior **must** include a corresponding update to the relevant chart(s) in the same commit or PR. There are no exceptions — a chart that does not match the code is actively misleading.

Before closing out any implementation task, verify whether the change warrants a chart update. If it does and the chart has not been updated, the task is not done.

## stdout Is a Contract

The entire correctness of this tool hinges on stream discipline. **stdout carries only machine output** that a shell will capture or `eval`: the selected worktree path from the picker, the emitted shell code from `init --print`. Everything else — the interactive UI, progress, warnings, errors, help text — goes to **stderr**.

- A single stray `console.log` breaks the user's `cd` silently. Never use `console.log` for diagnostics.
- All machine output flows through the project's single output component; no other code path writes to stdout.
- Every new code path must be explicit about which stream it writes to.
- Tests assert stdout **byte-exactness**: on success, the path (or emitted code) and nothing else; on cancel or error, stdout stays empty.

## Security

This CLI sits on two security boundaries: it shells out to `git`, and it emits code the user's shell will `eval`. Treat both edges as hostile-input surfaces:

- **Never build shell commands by string interpolation.** Spawn processes with `execFile`/`spawn` and argument arrays; never `{ shell: true }`, never `exec` with concatenated input.
- **Treat repository data as untrusted input.** Branch names, worktree paths, and remote names can contain metacharacters, quotes, and newlines — a branch can literally be named `$(rm -rf ~)`.
- **One audited quoting function per shell dialect.** Any value interpolated into emitted shell code must pass through the project's single per-shell quoting/escaping function. No ad-hoc escaping at call sites.
- **Validate user-supplied identifiers** (e.g. the `--as` function name) against an allowlist pattern before use.
- **rc-file writes are fenced and consensual.** Config files are modified only on the explicit `--install` path with confirmation, only inside the project's marker-fenced block, and idempotently.

## Dependencies

The runtime dependency budget is exactly one: `@clack/prompts`. Do not add runtime dependencies. Dev-dependency additions — and any change to this budget — are maintainer decisions: propose, don't install.

## JSDoc

Classes and functions must be documented with JSDoc. Do **not** add doc comments to types or interfaces — the language makes them self-explanatory.

The TypeScript annotation already declares the type, so omit redundant `@param {type}` / `@returns {type}` annotations — descriptions only.

```ts
/**
 * Renders the worktree picker using the Clack prompt library.
 *
 * @param worktrees - The worktrees to choose from.
 * @returns The selected worktree, or null when the user cancels.
 */
```

## File Naming

All source files must use **CamelCase** (e.g. `WorktreeRegistry.ts`, `ShellDetector.ts`, `FunctionEmitter.ts`). This applies to every file regardless of what it exports — classes, interfaces, types, constants, or utilities.

## Testing Philosophy

**Test behavior, not implementation.**

Tests verify that code works correctly for its consumers. Focus on **what** the code does, not **how** it does it internally.

### Core Rules

1. **Test through the public interface.** Never assert on private methods, internal state, or implementation details.
2. **Consumer-oriented.** When a component's consumer is another component, treat that consumer as the end user. Test what it sees and relies on.
3. **Implementation-proof.** If an implementation changes but behavior stays the same, tests MUST still pass.
4. **All code changes need tests.** New features, bug fixes, refactors.
5. **Unit tests never touch reality.** They must never spawn a real `git`, read or write real paths, or depend on the machine's shell or environment. Mock the boundaries — the git runner, the filesystem, the environment — with in-memory fakes and assert against those. Only the e2e layer touches reality, in disposable temp directories.

### Unit and End-to-End Coverage

"All code changes need tests" means **both** layers, where each applies:

- **Unit tests** — vitest, the default for every component: registries, emitters, detectors, resolvers, commands with faked boundaries.
- **End-to-end tests (slim)** — a small suite that runs the **built CLI** as a child process against a **fixture repo created in a temp directory** (real `git init` + `git worktree add`), asserting: the stdout contract (machine output only; UI and errors on stderr), that `init --print` output actually evaluates in a real shell (e.g. `zsh -c 'eval "$(…)"; typeset -f wtj'`), and error paths (not a repo → non-zero exit, empty stdout). Extend the e2e suite whenever a change affects **emitted shell code, CLI flags/exit codes, or the stdout contract**. Keep it slim — interactive picker behavior is unit-tested with the prompt layer faked, never e2e-driven.

### What to Assert

- Return values from public methods
- Side effects visible to consumers (what was written to which stream, what arguments a process boundary received)
- Exception/error behavior on invalid input
- Interface compliance
- Guarantees consumers depend on (e.g. identical output for identical input)

### What NOT to Assert

- Private/protected property values
- Internal data structures or storage format
- Which private helper methods were called
- How a value was computed (only that the result is correct)

### Examples

#### Good: Test behavior through the public interface

```ts
// Tests what consumers see: worktrees parsed from the porcelain contract
it('parses worktrees from porcelain output', async () => {
  const git = new FakeGitRunner({ 'worktree list --porcelain': PORCELAIN_TWO_TREES });
  const registry = new WorktreeRegistry(git);
  const trees = await registry.list();
  expect(trees.map((t) => t.branch)).toEqual(['master', 'feature/picker']);
});
```

#### Good: Test observable side effects

```ts
// Tests the external contract: stdout received the path and nothing else
it('prints only the selected path to stdout', async () => {
  const stdout = new FakeWriter();
  const command = new JumpCommand(registry, pickerSelecting('/repos/app/.claude/worktrees/picker'), stdout);
  await command.run();
  expect(stdout.contents()).toBe('/repos/app/.claude/worktrees/picker\n');
});
```

#### Bad: Testing implementation details

```ts
// BAD: reaches into private state — couples the test to a field name
it('stores worktrees in an internal array', async () => {
  const registry = new WorktreeRegistry(git);
  await registry.list();
  expect((registry as any).items).toHaveLength(2);
});
```

### Checklist Before Writing a Test

1. Am I testing a public method or observable side effect?
2. Would this test break if I refactored internals without changing behavior?
   - If yes, rewrite the test.
3. Does this test cast to `any` (or similar) to reach private members?
   - Never in assertions.
4. Am I asserting the **result** or the **mechanism**?
   - Assert the result.

### Tooling

Run tests through the project's defined test scripts rather than invoking a runner directly, so you inherit its configuration. Find the available test/coverage scripts in `package.json` rather than assuming their names.

## Don't Live with Broken Windows

When you notice a defect — a bug, a failing or skipped test, a lint violation, dead or wrong code, a misleading comment, a contract that no longer matches the code — **deal with it.** "It's pre-existing" or "not part of my change" is not a reason to leave it broken: a defect you saw and walked past is one you now own. One unrepaired broken window invites the next, and the codebase rots.

- **Fix it now**, in the same change, when the fix is small and in scope.
- **If it's genuinely too large or out of scope**, don't silently move on — surface it to the maintainer and track it (issue, backlog item, or a TODO with enough context to act on later). Board the window up; never just pass it.
- **Never normalize a broken state.** Don't skip a failing test, suppress a warning, or rewrite an assertion to match wrong behavior just to reach green. That isn't a fix — it's a bigger broken window.

## Linting

**Never silence a linter or compiler finding on your own judgement.** Do not reach for `// eslint-disable`, `@ts-expect-error`/`@ts-ignore`, or a config exclusion just to make an error or warning go away. A self-applied suppression hides a problem instead of fixing it.

- **Fix the cause.** Almost every finding has a real fix: narrow the type, restructure the code, handle the case the linter says you're not handling.
- **If you genuinely cannot get around a finding, stop and ask.** Surface the exact rule and code, explain why no code fix works, and let the maintainer decide. **Suppression is the maintainer's call, never the agent's.** Every approved suppression names the rule and carries a justification, and is scoped as narrowly as possible (a single line, never a file or the config).

## Running Lints & Tests

**Never pipe a lint or test command through `tail` (or `head`), or otherwise truncate its output.** This applies to every lint, test, and type-check command in the project.

- **Findings print above the footer.** Linters and test runners typically print their error report *before* the trailing summary line. Truncating to the last few lines shows only that footer, so an entire report of failures is invisible and the run looks clean.
- **A pipe masks the exit code.** In `cmd | tail`, the shell reports `tail`'s status (always `0`), hiding a real non-zero failure.
- **Instead:** run the command with full output and confirm the genuine exit code, e.g. `pnpm lint; echo "EXIT=$?"`. Read the whole report, or `grep` for the error summary. Reserve truncation for genuinely verbose commands that clearly succeed at the end (installs, builds), and even then check the real status (e.g. `${PIPESTATUS[0]}`).

## CI — Wait for Every Check to Finish Green

CI runs after every push to a pull request and after every merge. Before treating any work as done — or moving on to anything that depends on it — **wait until all CI checks have finished and are green.**

- **The visible checks are not necessarily the whole set.** A check that passes can trigger further checks that are queued, not yet started, or not yet visible at the moment you look. Discover which checks the repository actually runs and wait for the complete set to settle — including any that appear only after earlier ones pass.
- **Never act on a partial or pending result.** Do not merge, report success, or walk away while any check is still running, queued, or yet to be triggered. "Green" means every check that will run has run and passed.
- **If any check ends red, stop and fix it before proceeding.** Never leave a branch — or the default branch — in a failing state.

### Squash-Merging — Always Supply Your Own Commit Message

When squash-merging a PR into `master`, **always provide an explicit commit subject and body** — never accept GitHub's auto-generated squash message.

- **Why this matters.** GitHub's default squash message concatenates the message of *every* squashed commit into the body. If any of those commits carries a CI directive such as `[skip ci]` (common on docs commits), it lands in the merge commit message, and GitHub then **skips every workflow for that push to `master`** — silently. The merge looks done, but nothing was validated.
- **How.** Pass the message explicitly: `gh pr merge <n> --squash -t "[TYPE]: <description>" -b "<concise human summary>"` (or edit the squash message in the GitHub web UI before confirming). The subject follows the Conventional Commits format below; the body is a short hand-written summary, never the raw list of squashed commits.
- **Never** let `[skip ci]` (or any other skip directive) reach a commit that will be squashed into `master`.

## Commit Conventions — Conventional Commits

### Commit Message Format

Use the following format for all commit messages:

```
[{TYPE}]: {description}
```

### Commit Types

- **FEAT**: A new feature for the user
- **FIX**: A bug fix
- **DOCS**: Documentation only changes
- **STYLE**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **REFACTOR**: A code change that neither fixes a bug nor adds a feature
- **PERF**: A code change that improves performance
- **TEST**: Adding missing tests or correcting existing tests
- **CHORE**: Changes to the build process or auxiliary tools and libraries such as documentation generation

### Examples

```
[FEAT]: add shell function emitter
[FIX]: resolve zdotdir resolution on macos
[DOCS]: update init documentation
[STYLE]: fix code formatting
[REFACTOR]: restructure worktree registry
[PERF]: improve porcelain parsing
[TEST]: add unit tests for rc installer
[CHORE]: update dependencies
```

### **IMPORTANT**
**DO NOT INCLUDE AI TOOL CREDITS OR CO-AUTHORSHIP ATTRIBUTION IN COMMIT MESSAGES**

### Guidelines

- Don't list extra changes or explanations in the commit message after the main description
- Use the imperative mood in the description ("add" not "added" or "adds")
- Don't capitalize the first letter of the description
- Capitalize the type (feat, fix, etc.)
- No period at the end of the description
- Keep the description concise (50 characters or less is ideal)
- After making a commit, explain to the user your reasoning behind choosing the commit type and description
