# GitHub Actions reference

Load this after `SKILL.md` when writing or reviewing workflows. Replace `<sha>` with the full 40-character commit SHA of the release you reviewed, and keep the version in a trailing comment so Dependabot can update both.

## CI template (Node project)

```yaml
name: ci

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    strategy:
      fail-fast: false
      matrix:
        node: [20, 22]
    steps:
      - uses: actions/checkout@<sha> # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: ${{ matrix.node }}
          cache: npm
      - run: npm ci
      - run: npm run verify
```

`persist-credentials: false` stops the checkout token from staying in the git config for later steps.

## Injection-safe scripts

```yaml
# Bad: the PR title is interpolated into the shell script
- run: echo "PR title is ${{ github.event.pull_request.title }}"

# Good: pass it as an environment variable
- env:
    TITLE: ${{ github.event.pull_request.title }}
  run: echo "PR title is $TITLE"
```

## Dependabot for actions and npm

`.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    groups:
      actions:
        patterns: ["*"]
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

## Release skeleton with OIDC publishing

```yaml
name: release

on:
  push:
    tags: ["v*"]

permissions:
  contents: read

jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: release
    permissions:
      contents: write     # create the GitHub release
      id-token: write     # OIDC / npm provenance
    steps:
      - uses: actions/checkout@<sha> # v4
        with:
          persist-credentials: false
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: npm
      - run: npm ci
      - run: npm run verify
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}   # drop this when npm trusted publishing is configured
```

Protect the `release` environment with required reviewers. Prefer npm trusted publishing (OIDC) so no token is stored.

## Reusable workflow

```yaml
# .github/workflows/node-ci.yml
on:
  workflow_call:
    inputs:
      node-version:
        type: string
        default: "22"
permissions:
  contents: read
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha> # v4
      - uses: actions/setup-node@<sha> # v4
        with:
          node-version: ${{ inputs.node-version }}
          cache: npm
      - run: npm ci && npm test
```

Call it with `uses: ./.github/workflows/node-ci.yml` and `with: { node-version: "22" }`.

## Hardening checklist

- [ ] Top-level `permissions: contents: read`; elevated per job only
- [ ] Third-party actions pinned to full SHAs; Dependabot updates them
- [ ] No untrusted `${{ ... }}` inside `run:`; values pass through `env:`
- [ ] No `pull_request_target` running fork code with secrets
- [ ] Secrets scoped to environments; production behind required reviewers
- [ ] OIDC instead of long-lived cloud or registry tokens
- [ ] `timeout-minutes`, `concurrency`, and artifact `retention-days` set
- [ ] `persist-credentials: false` on checkouts that do not push
- [ ] Workflows linted with `actionlint` and a security linter
- [ ] Branch protection requires the CI check before merge

## Debugging

1. Read the first failing step, not the last.
2. Re-run with debug logging enabled.
3. Reproduce locally with the same commands and Node or toolchain version.
4. Use `workflow_dispatch` to test changes on a branch without merging.
5. For flaky runs, check cache keys, shared artifacts, and external services.

## Sources

- [Security hardening for GitHub Actions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [Workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [Dependabot version updates](https://docs.github.com/en/code-security/dependabot/dependabot-version-updates)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
- [actionlint](https://github.com/rhysd/actionlint)
- [zizmor](https://github.com/zizmorcore/zizmor)
