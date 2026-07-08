# Initial Implementation Plan

## What the tool is

`worktree-jumper` eliminates the friction of cd-ing between git worktrees.
Running the emitted shell function (`wtj` by default) shows an interactive
picker of the current repo's worktrees; selecting one `cd`'s the shell there.
Because a child process can't change its parent shell's cwd, the architecture
is: the binary prints the selected path to stdout; a small shell function
(emitted by `worktree-jumper init`) captures it and performs the `cd`.

## Package scaffold

- `package.json`: name `worktree-jumper`, version `1.0.0-dev`, `"type":
  "module"`, `packageManager` pnpm (current version), `engines.node
  >=22.13.0`, license `Apache-2.0`, repository
  `git+https://github.com/erdembircan/worktree-jumper.git`, author `Erdem
  Bircan`, `bin: { "worktree-jumper": "bin/worktree-jumper.js" }`, `files:
  ["dist","bin","LICENSE","README.md"]`.
- Scripts: `build` (node scripts/build.js), `typecheck` (tsc --noEmit),
  `test` (vitest run, unit only), `test:watch`, `test:e2e` (vitest run with
  a separate e2e config; e2e must build first — pretest step or build in the
  config's globalSetup), `lint` (eslint .), `lint:fix`.
- Runtime dependency: `@clack/prompts` ONLY. Dev deps: typescript (strict),
  @types/node, vitest, esbuild, eslint + @eslint/js + typescript-eslint +
  prettier + eslint-config-prettier + eslint-plugin-prettier (flat config).
- `tsconfig.json`: strict true, module/moduleResolution NodeNext, target
  ES2022+, noEmit for typecheck.
- `scripts/build.js`: esbuild — bundle `src/index.ts` → `dist/index.js`,
  ESM, platform node, `@clack/prompts` external, inject version via
  `define` of a `__VERSION__` constant read from package.json (declare
  `declare const __VERSION__: string` in a d.ts; give vitest the same
  `define` so tests/typecheck don't break).
- `bin/worktree-jumper.js`: executable shim importing `../dist/index.js`.
- `.gitignore`: `node_modules/`, `dist/`, `.claude/` — the `.claude/` entry
  is mandatory, nothing under it may ever be committed.
- ESLint/prettier: flat `eslint.config.js` with typescript-eslint
  recommended + prettier; MUST ignore `.claude/`, `dist/`, `node_modules/`.
- `README.md`: concise — what it does, why the shell-function architecture
  (child process can't cd parent), install, the init flows, supported
  shells (bash/zsh/fish), the universal line `eval "$(worktree-jumper init
  --print)"` note (fish ≥3.4), security notes.
- `LICENSE`: generated using `license-wizard` (Apache-2.0, year 2026,
  holder "Erdem Bircan"), synced into `package.json`'s license field.
- CI: `.github/workflows/ci.yml` — on push to master + pull_request:
  checkout, pnpm/action-setup, setup-node 22 with pnpm cache, `pnpm install
  --frozen-lockfile`, typecheck, lint, test, build, test:e2e. Single job is
  fine.
- Commit `pnpm-lock.yaml`.

## CLI surface

- `worktree-jumper` (no args) → the picker (JumpCommand).
- `worktree-jumper init [shell] [--print] [--install] [--as <name>]`
  (InitCommand). shell ∈ bash|zsh|fish.
  - `init` (no flags): detect shell; print human-readable instructions to
    **stderr**: the eval line to add (`eval "$(worktree-jumper init <shell>
    --print)"`) and the resolved config file path for that shell.
  - `init [shell] --print`: emit the shell function source to **stdout**
    (this is what the eval line consumes). Without explicit shell, detect.
  - `init <shell> --install`: REQUIRES explicit shell (detection +
    --install → usage error, exit 2). Shows resolved rc path, asks
    confirmation via a clack confirm (UI on stderr), then installs.
    zsh/bash: append a fenced block (`# >>> worktree-jumper >>>` / `# <<<
    worktree-jumper <<<`) containing the eval line to the rc file. fish:
    write `${XDG_CONFIG_HOME:-~/.config}/fish/conf.d/worktree-jumper.fish`
    containing a guarded source line (`command -q worktree-jumper; and
    worktree-jumper init fish --print | source`). Idempotent: existing
    fence → replace in place, never duplicate.
  - `--as <name>`: function name, default `wtj`. Validate against
    `^[A-Za-z_][A-Za-z0-9_]*$`; reject otherwise (usage error, exit 2).
- `--version` → version string to stdout. `--help` / `-h` → usage to
  stdout (explicitly-requested output counts as that invocation's machine
  output).
- Exit codes: 0 success; 1 runtime error (not a git repo, git missing,
  non-TTY picker); 2 usage error; 130 picker cancelled (Esc/Ctrl-C) —
  stdout EMPTY on every non-0 path.

## Picker behavior (JumpCommand)

- `@clack/prompts`: `intro` header showing `worktree-jumper v1.0.0-dev`
  (name + injected version), then a `select` listing worktrees. ALL clack
  output goes to **stderr** via the `output` stream option every clack call
  accepts.
- Each option: label = branch name (or `detached @ <short-sha>`, or
  `(bare)`), hint = worktree path with `$HOME` abbreviated to `~`; the
  current worktree (the one containing cwd, via `git rev-parse
  --show-toplevel`) marked `(current)` and pre-selected.
- On select: print absolute worktree path + `\n` to stdout via the single
  machine-output component. Exit 0.
- On cancel (clack cancel symbol): nothing on stdout, exit 130.
- Not inside a git repo: error message on stderr, exit 1.
- Non-TTY stdin/stderr: error "interactive terminal required" on stderr,
  exit 1.
- Single worktree (no linked ones): still show the picker with the one
  entry.

## Architecture (isolated, injectable components)

- `src/index.ts` — entry: builds real dependencies, parses argv, dispatches,
  maps thrown errors to stderr messages + exit codes. Top-level try/catch so
  no stack trace ever hits stdout.
- `src/cli/ArgvParser.ts` — tiny hand-rolled argv parser (no dependency):
  produces a discriminated-union command description; throws UsageError on
  unknown flags/values.
- `src/git/GitRunner.ts` — `interface GitRunner { run(args: string[]):
  Promise<string> }` + `ExecFileGitRunner` using `node:child_process`
  `execFile` (NEVER exec/shell:true). Distinguish "not a repo" (git exit
  128) via a typed error.
- `src/git/Worktree.ts` — domain type: `{ path, head, branch: string |
  null, isBare, isDetached, isLocked, isCurrent }`.
- `src/git/WorktreeRegistry.ts` — `list(): Promise<Worktree[]>` parsing
  `git worktree list --porcelain -z` (NUL-separated; handles paths with
  spaces/newlines; attributes: `worktree`, `HEAD`, `branch refs/heads/…`
  stripped to short name, `bare`, `detached`, `locked`, `prunable`).
  Current-worktree detection via `git rev-parse --show-toplevel`
  (realpath-normalized).
- `src/shell/ShellKind.ts` — `'bash' | 'zsh' | 'fish'` + parse/guard.
- `src/shell/ShellDetector.ts` — try parent-process walk (`ps -o comm= -p
  <ppid>` via execFile) matching a known shell; fall back to `$SHELL`
  basename; both boundaries injectable. Unknown → typed error telling the
  user to pass the shell explicitly.
- `src/shell/ShellQuoter.ts` — THE single audited quoting component (per
  CLAUDE.md Security). POSIX single-quote escaping (`'` → `'\''`) for
  bash/zsh; fish escaping (`'` → `\'`, `\` → `\\` inside single quotes).
  Every dynamic value entering emitted shell code goes through it.
- `src/shell/FunctionEmitter.ts` — `emit(shell, functionName): string`.
  Validates the name. Bodies use `command worktree-jumper` to be
  alias/function-safe.
- `src/shell/RcResolver.ts` — resolves install target per shell from
  injected env: zsh `${ZDOTDIR:-$HOME}/.zshrc`; bash `$HOME/.bashrc`
  (mention macOS `.bash_profile` sourcing caveat in the human instructions,
  don't try to fix it); fish `${XDG_CONFIG_HOME:-$HOME/.config}/fish/conf.d/
  worktree-jumper.fish` (kind: fenced-append vs conf.d-file).
- `src/shell/RcInstaller.ts` — fenced install/replace, idempotent, via
  injected minimal `FileSystem` interface (`readFile/writeFile/exists/
  mkdir`) with a real `node:fs/promises` impl and an in-memory fake for
  tests.
- `src/ui/Picker.ts` — clack wrapper; the ONLY module importing
  @clack/prompts; returns selected Worktree or a cancel sentinel.
- `src/ui/MachineOutput.ts` — the single stdout writer; everything else
  writes stderr.
- `src/commands/JumpCommand.ts`, `src/commands/InitCommand.ts` —
  orchestration only, fully unit-testable with fakes.

## Architectural chart

`docs/contracts/architecture.md` — mermaid `classDiagram` of the public
contracts above, kept current with the codebase.

## Tests

Unit (vitest, fakes only — never real git/fs/env/processes; assert stdout
byte-exactness where relevant):

- WorktreeRegistry: multi-worktree parse, detached, bare, locked, branch
  shortening, paths with spaces and embedded newlines, current-marking,
  not-a-repo typed error.
- ShellQuoter: quotes, `$(…)`, backticks, `$vars`, newlines, backslashes —
  per dialect; assert exact escaped output.
- FunctionEmitter: exact/snapshot output per shell; custom `--as`; rejects
  `bad;name`, `rm -rf`, leading digit, empty.
- ShellDetector: ppid-walk hit, $SHELL fallback, unknown → typed error (all
  via fakes).
- RcResolver: ZDOTDIR set/unset, XDG_CONFIG_HOME set/unset.
- RcInstaller: fresh append, idempotent re-run (replace, not duplicate),
  remove leaves rest of file intact, missing file/dir created.
- JumpCommand: prints exactly `<path>\n` on select; cancel → empty stdout +
  130 signal; not-a-repo → stderr message, empty stdout.
- InitCommand: each flow incl. `--install` without shell → usage error.
  ArgvParser: flag combinations, unknown flag.
- No test may depend on the runner machine's $SHELL/ZDOTDIR — always inject
  env.

E2E (slim, separate config, runs the BUILT binary as a child process):

- globalSetup builds; each test creates a fixture repo in a fresh temp dir
  (`fs.mkdtemp` in `os.tmpdir()`): `git init`, config user, commit, `git
  worktree add` one or two linked worktrees (one with a space in the
  directory name). Temp dirs avoid nested-repo refusals; clean up after
  each test.
- `init zsh --print` output evals in real zsh: `zsh -c 'eval "$(node
  <bin-shim> init zsh --print)"; typeset -f wtj'` exits 0. Same for bash
  with `type wtj`. Fish only if `fish` exists on PATH, otherwise skip.
- Not a git repo: run in empty temp dir → exit 1, stdout EMPTY, stderr
  non-empty.
- Non-TTY picker: run default command with piped stdio inside the fixture
  repo → exit 1, stdout empty, stderr mentions interactive terminal.
- `--version` prints `1.0.0-dev`.

## Security requirements (non-negotiable)

execFile/spawn with arg arrays only; branch names & paths are untrusted;
all interpolation into emitted shell code via ShellQuoter; `--as` allowlist
validation; rc writes only inside the fence on the explicit --install path.

## Deviation rule

If the plan conflicts with reality (e.g. @clack/prompts API differs,
license-wizard has no non-interactive mode), prefer reality, adapt
minimally, and record every deviation in the PR body and the final report.
Do not silently redesign.
