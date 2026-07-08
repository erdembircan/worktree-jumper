# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Color-coded worktree listing** — the interactive picker now renders each
  kind of information in its own color (branch, path, commit sha, and status
  markers), making entries easier to distinguish at a glance. Color is native
  (Node's `util.styleText`, no new dependency) and is automatically disabled
  when the terminal doesn't support it or `NO_COLOR` is set.

## [1.0.0] - 2026-07-08

Initial public release.

### Added

- **Interactive worktree picker** — run `wtj` to pick one of the current
  repository's worktrees and `cd` straight into it. The picker marks the worktree
  you are already in, and writes only the chosen path to stdout so the surrounding
  shell function can change directory.
- **`worktree-jumper init`** — detects your shell and prints the exact `eval` line
  to add to your shell config, along with the file to add it to, without writing
  anything itself.
- **`worktree-jumper init <shell> --install`** — writes that `eval` line into your
  shell config for you, inside a fenced marker block and only after an explicit
  confirmation.
- **`--as <name>`** — customize the installed shell function's name, which defaults
  to `wtj`.
- **Shell support** — works with bash, zsh, and fish (3.4+).
- **`--version`** — print the version number, sourced from `package.json`.
- **`--help`** — print the full usage and flag list.

[1.0.0]: https://github.com/erdembircan/worktree-jumper/releases/tag/v1.0.0
