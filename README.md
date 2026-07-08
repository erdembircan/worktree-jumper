# worktree-jumper

Interactively jump between git worktrees from your shell.

Run `wtj` (the default name), pick a worktree from the list, and your
shell `cd`'s straight there.

## Why a shell function?

A CLI binary runs as a child process, and a child process can never change
its parent shell's working directory — that's an OS-level constraint, not
a limitation of this tool. So `worktree-jumper` is split in two:

- the **binary** shows the picker and prints the selected worktree's path
  to stdout;
- a small **shell function**, emitted by `worktree-jumper init`, captures
  that output and runs `cd` in your actual shell.

`worktree-jumper init --print` is what you `eval` to define the function;
`worktree-jumper` (no arguments) is what the function calls under the hood.

## Install

```sh
npm install -g worktree-jumper
```

Node 22.13+ is required.

## Setup

### Quick start

```sh
worktree-jumper init
```

With no arguments, `init` detects your shell and prints the exact line to
add to your shell config, along with the resolved path of that config
file. Nothing is written for you — this is purely instructions.

### Print the function yourself

```sh
worktree-jumper init [bash|zsh|fish] --print
```

Prints the shell function source. This is what the eval line consumes:

```sh
eval "$(worktree-jumper init zsh --print)"
```

The same line works in bash and fish too — just swap the shell name (fish
needs 3.4 or newer for the `$(...)` command-substitution syntax used
here).

### Let it install itself

```sh
worktree-jumper init zsh --install
```

`--install` requires an explicit shell (it won't guess). It shows you the
resolved config file path, asks for confirmation, and then:

- **bash/zsh**: appends a fenced block (`# >>> worktree-jumper >>>` /
  `# <<< worktree-jumper <<<`) containing the eval line to your rc file.
  Re-running `--install` replaces that block in place instead of
  duplicating it.
- **fish**: writes a guarded source line to
  `${XDG_CONFIG_HOME:-~/.config}/fish/conf.d/worktree-jumper.fish`, a file
  fish loads automatically — no need to touch `config.fish`.

On macOS, non-login bash shells (most terminal tabs) source `.bashrc` only
if your `.bash_profile` explicitly sources it. `--install` writes to
`.bashrc`; if your bash setup doesn't source it, you'll need to add that
line yourself.

### Custom function name

By default the emitted function is named `wtj`. Use `--as` to change it:

```sh
worktree-jumper init zsh --install --as jump
```

Function names are validated against `^[A-Za-z_][A-Za-z0-9_]*$`.

## Usage

```
wtj
```

Shows an interactive picker of the current repository's worktrees —
branch name (or `detached @ <sha>` / `(bare)`), with the path as a hint
and the worktree you're already in marked `(current)`. Selecting one `cd`'s
your shell there. Press Esc/Ctrl-C to cancel without moving.

## Supported shells

bash, zsh, and fish (3.4+).

## Security notes

- Every `git` invocation and the shell detector's process lookup use
  `execFile` with argument arrays — never a shell, never string-interpolated
  commands.
- Repository data (branch names, worktree paths) is treated as untrusted:
  anything that ends up in emitted shell code is passed through a single,
  audited per-shell quoting function.
- The `--as` function name is checked against an identifier allowlist
  before it's ever used.
- Your shell config is only ever touched on the explicit `--install` path,
  after an interactive confirmation, and only inside the tool's own
  marker-fenced block (or its own dedicated fish conf.d file).
