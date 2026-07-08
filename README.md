# worktree-jumper

Interactively jump between git worktrees from your shell. Run `wtj`, pick
a worktree from the list, and your shell `cd`'s straight there.

## Why

Worktrees used to be a niche git feature. AI-assisted development made
them everyday infrastructure: coding agents isolate their work in
parallel worktrees, so several branches now move at once on the same
repo instead of one at a time.

That shifts the human's job to hopping between those worktrees all day —
reviewing an agent's diff, running the code, testing a PR locally before
merging it. Git has no built-in command to switch *into* a worktree, so
the ritual is always the same:

- `git worktree list`, find the right row
- select and copy a long, unmemorable path (`.claude/worktrees/fix-auth-redirect`...)
- assemble a `cd`, paste it

Do that a few dozen times a day and it's real friction. `worktree-jumper`
collapses the whole thing into: type `wtj`, pick, land.

## Install

```sh
npm install -g worktree-jumper
```

Node 22.13+ is required.

## Setup

```sh
worktree-jumper init
```

With no arguments, this detects your shell and prints the exact line to
add to your shell config, along with the file to add it to — nothing is
written for you. That line is a small `eval`; the binary itself can't
`cd` your shell (only a child process, it can't reach into its parent),
so `init` hands you a tiny shell function that does.

Prefer not to copy-paste it yourself:

```sh
worktree-jumper init zsh --install
```

`--install` needs an explicit shell (bash, zsh, or fish). It shows you
the config file it's about to touch, asks for confirmation, and wires up
the `eval` line for you — your shell config is only ever touched on this
explicit path, after you say yes. It also tells you how to activate the
change in your *current* shell right away, without opening a new one.

### Custom function name

By default the function you get is `wtj`. To use a different name, add
`--as <name>` — to both the `eval` line and the `--install` form:

```sh
eval "$(worktree-jumper init zsh --print --as jump)"
```

```sh
worktree-jumper init zsh --install --as jump
```

The name can contain letters, digits, and underscores, and can't start
with a digit. Whichever name you install with is what you type daily, so
pick one and use it consistently — if you reinstall with a different
`--as`, the old function name stops working until you re-source your
shell config.

## Usage

```sh
wtj
```

Shows an interactive picker of the current repository's worktrees —
branch name (or `detached @ <sha>` / `(bare)`), with the path as a hint
and the worktree you're already in marked `(current)`. Selecting one
`cd`'s your shell there. Press Esc/Ctrl-C to cancel without moving.

## Supported shells

bash, zsh, and fish (3.4+).
