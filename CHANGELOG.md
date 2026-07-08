# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-07-08

### Added

- Interactive worktree picker: run `wtj` to choose a worktree from the current repository and `cd` straight into it.
- `worktree-jumper init` — detects the shell and prints the exact `eval` line (and the config file to add it to) without writing anything.
- `worktree-jumper init <shell> --install` — writes the `eval` line into the shell config, fenced by markers and only after explicit confirmation.
- `--as <name>` to customize the installed shell function name (defaults to `wtj`).
- Support for bash, zsh, and fish (3.4+).
- `--version` and `--help` output.

[unreleased]: https://github.com/erdembircan/worktree-jumper/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/erdembircan/worktree-jumper/releases/tag/v1.0.0
