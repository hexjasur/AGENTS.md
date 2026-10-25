---
name: github-actions
description: Write, secure, speed up, and debug GitHub Actions workflows with least-privilege permissions, SHA-pinned actions, injection-safe scripts, OIDC instead of long-lived secrets, caching, matrices, concurrency, reusable workflows, release automation, and Dependabot for actions. Use when creating or reviewing CI/CD workflows, fixing slow, flaky, or failing runs, hardening a pipeline against supply-chain attacks, or automating releases and package publishing.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# GitHub Actions

A workflow runs code with repository secrets on shared machines. Treat it like production code: minimal permissions, pinned dependencies, and no untrusted input in shells.

## Procedure

```text
- [ ] 1. Define the trigger, the jobs, and what each job needs to read or write
- [ ] 2. Set top-level permissions to read-only; elevate per job
- [ ] 3. Pin every third-party action to a full commit SHA
- [ ] 4. Keep untrusted input out of shell scripts
- [ ] 5. Add caching, concurrency, timeouts, and a matrix where useful
- [ ] 6. Lint the workflow, test on a branch, and enable Dependabot for actions
```

1. Prefer `pull_request` for CI. Use `push` on the default branch and tags for release, and `workflow_dispatch` for manual runs with typed inputs.
2. Start with `permissions: contents: read`. Add `contents: write`, `pull-requests: write`, `id-token: write`, or `packages: write` only on the job that needs them.
3. Write `uses: owner/action@<40-char-sha> # v4.2.1` so a moved tag cannot change what runs. Let Dependabot update the SHAs.
4. Pass context through `env:` and reference shell variables (`"$TITLE"`) instead of interpolating `${{ github.event.* }}` inside `run:`.
5. Use the built-in cache of the `setup-*` actions or `actions/cache` keyed on the lockfile hash. Add `concurrency` to cancel superseded runs, `timeout-minutes` on every job, and `strategy.matrix` with `fail-fast: false` for platform builds.
6. Run `actionlint` (and a security linter such as `zizmor`) in CI, test changes on a branch, and enable `.github/dependabot.yml` for the `github-actions` ecosystem. Templates are in `references/workflows.md`.

## Guardrails

- Never use `pull_request_target` or `workflow_run` to check out and run code from a fork with secrets or write permissions.
- Never interpolate untrusted values (`github.event.pull_request.title`, branch names, issue bodies, commit messages) directly into `run:` scripts.
- Never print secrets, pass them on the command line, or write them to artifacts. Masking is not a security boundary.
- Never give a workflow more permissions than its jobs use, and never use broad personal access tokens when `GITHUB_TOKEN` or OIDC works.
- Never publish packages, create releases, or deploy from untrusted branches. Gate production with protected environments and required reviewers.
- Do not pin to mutable tags or branches (`@main`, `@v4`) for third-party actions in security-sensitive workflows.

## Gotchas

- Secrets are not available to workflows triggered by pull requests from forks. Design CI so it does not need them, and run privileged steps in a separate trusted workflow.
- `GITHUB_TOKEN` events do not trigger new workflow runs (to prevent loops). Use a GitHub App token or `workflow_dispatch` when you need chaining.
- Use OIDC (`id-token: write`) with cloud providers and with npm trusted publishing where supported, so no long-lived token is stored.
- Cache keys must include the lockfile hash and the OS; a broad key restores stale or poisoned caches.
- `concurrency` with `cancel-in-progress: true` is right for CI and wrong for release and deploy jobs; use a queue there.
- A matrix job writing to the same release or artifact name races. Create the release first, upload to it from each job, and publish at the end.
- `if:` expressions evaluate strings; compare booleans carefully (`inputs.force == 'true'` for `workflow_dispatch` inputs in some contexts).
- Default shell for `run:` on Linux is `bash -e`; add `set -euo pipefail` for pipelines and multi-line scripts.
- Re-run with debug logging (`ACTIONS_STEP_DEBUG` and `ACTIONS_RUNNER_DEBUG` secrets, or the re-run option) before guessing.
- Self-hosted runners persist state between jobs and are risky for public repositories.
- Artifacts and logs count toward storage; set `retention-days`.

## Report format

For a review: list findings by risk (secret exposure or code injection, excess permissions, unpinned dependencies, reliability, speed), each with the workflow, line, the attack or failure it enables, and the fix. State which workflows were run or linted.

Read `references/workflows.md` for a CI template, Dependabot config, release skeleton, reusable-workflow pattern, and a hardening checklist.
