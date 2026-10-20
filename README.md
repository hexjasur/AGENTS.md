# @hexjasur/agents-md

Install and update the [`AGENTS.md`](./AGENTS.md) instructions in any project with a small cross-platform CLI. Use it through npm/npx or the included shell script.

**Requirements:** Node.js 18 or later.

## Quick start with npx

Install the instructions in the current directory:

```sh
npx -y @hexjasur/agents-md
```

Choose a target directory or update a previous installation:

```sh
npx -y @hexjasur/agents-md init ./my-app
npx -y @hexjasur/agents-md update ./my-app
```

## Run from a source checkout

From the repository root, use the shell entry point:

```sh
./install-agents.sh
./install-agents.sh init ../my-project
./install-agents.sh update ../my-project
```

Both entry points call the same Node.js implementation. The shell entry point requires a POSIX-compatible shell, such as Linux, macOS, WSL, or Git Bash.

## CLI reference

```text
npx -y @hexjasur/agents-md [init] [directory]
npx -y @hexjasur/agents-md update [directory] [--force]
npx -y @hexjasur/agents-md --help
```

The directory defaults to the current working directory. `init` is the default command.

## Existing-file safety

If the destination already contains `AGENTS.md`, the interactive `init` command asks whether to delete, replace, or cancel. Cancel is the default, so pressing Enter leaves the existing file unchanged. Non-interactive runs also preserve the existing file.

Before updating or removing a managed file, the CLI compares its SHA-256 hash with the installation record. If the file was edited, the operation stops unless `--force` is explicitly supplied to `update`:

```sh
npx -y @hexjasur/agents-md update ./my-app --force
```

`--force` is only supported by `update`. During `init`, replacing an existing file requires an explicit interactive choice.

## Installation record

The CLI keeps its installation record at `.agent/hexjasurs.agent.scheme.json`. It contains the manifest schema version, installed package version, timestamp, and SHA-256 hash of the installed `AGENTS.md`.

The record is validated before use. Invalid JSON, schema, version, timestamp, or hash causes the operation to stop. Symlinked target files and metadata paths are rejected. When updating an installation created by version 1.0.0, the CLI migrates the record from `.agents-md/installation.json` and removes the old directory if it is empty.

The hash detects accidental or local edits; it is not a digital signature. Anyone able to edit both the file and its record can change both. Only run the CLI from a trusted source.

## Development and release checks

```sh
npm test
npm pack --dry-run
```

To test the package contents locally, create a tarball with `npm pack`, install it into a temporary project, and run the generated `agents-md` executable.

Before publishing a release:

1. Confirm that the npm account has publish access to the package scope.
2. Run the tests and review `npm pack --dry-run`.
3. Set a new version in `package.json`.
4. Publish a public scoped package with `npm publish --access public`.

Publishing to npm does not push changes to the Git repository.

## Project links

- Repository and issue tracker: [hexjasur/AGENTS.md](https://github.com/hexjasur/AGENTS.md)
- License: MIT
