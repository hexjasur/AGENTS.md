# @hexjasur/agents-md

CLI to install the repository's `AGENTS.md` rules in another project. It supports both npm/npx and a shell entry point. Requires Node.js 18 or newer.

> The package source is in GitHub. Until it is published to npm, the `npx @hexjasur/agents-md` command is not available from the public npm registry. Use the local shell/Node commands below to test it.

## Quick start

From this repository:

```sh
# Install into the current project directory
./install-agents.sh

# Or select a directory
./install-agents.sh init ../my-project

# Update a previously installed copy
./install-agents.sh update ../my-project
```

The npm command after publication will be:

```sh
npx @hexjasur/agents-md                 # initialize current directory
npx @hexjasur/agents-md init ./my-app   # initialize selected directory
npx @hexjasur/agents-md update ./my-app # update managed copy
```

Both entry points call the same Node.js implementation. The `.sh` entry point requires Node.js and a POSIX-compatible shell (for example, Linux, macOS, WSL, or Git Bash).

## Existing AGENTS.md behavior

If the destination already contains `AGENTS.md`, init asks what to do:

- `d` — delete the existing file and its installer manifest.
- `r` — replace it with the repository's current file and record a new manifest.
- Enter, an empty response, or an unknown response — cancel without changing the existing file.

In a non-interactive run the existing file is left untouched. Update does not ask before replacing a managed file: it verifies that the current file still matches its recorded SHA-256 hash. If the file was edited, update stops unless `--force` is explicitly given:

```sh
./install-agents.sh update ./my-app --force
```

`--force` is intentionally not an init option; init uses an interactive choice so replacement is deliberate.

## Installation record and validation

The installer stores metadata at `.agents-md/installation.json`, including the manifest schema version, installed package version, timestamp, and SHA-256 of the installed file. The manifest has a strict set of fields. Versions are bounded and validated before use, and are never treated as paths or URLs. Invalid JSON, schema, version, timestamp, or hash causes update to stop. Symlinked target files and metadata paths are rejected.

The hash detects local edits; it is not a digital signature. A user able to edit both the file and manifest can change both. Only run the CLI from a trusted source.

## Test locally

```sh
npm test
npm pack --dry-run
```

To try the packed npm CLI without publishing, create a tarball with `npm pack`, install that tarball into a temporary folder, then run its `agents-md` executable there.

## Publish checklist

1. Confirm the npm package name and npm account/scope are available and authorized.
2. Run `npm test` and inspect `npm pack --dry-run`.
3. Bump `version` in `package.json` for each release.
4. Publish with the intended public access, for example `npm publish --access public` for a public scoped package.

Publishing is separate from pushing this Git repository.

## Repository

- Source and issue tracker: [hexjasur/AGENTS.md](https://github.com/hexjasur/AGENTS.md)
- License: declared as MIT in package metadata.
