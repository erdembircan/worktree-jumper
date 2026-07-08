# worktree-jumper

Interactively jump between git worktrees from your shell. Run `wtj`, pick
a worktree from the list, and your shell `cd`'s straight there.

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

```sh
worktree-jumper init zsh --install --as jump
```

The default is `wtj`.

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
