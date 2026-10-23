---
name: repo-quality
description: Safely modify and ship a software repository with minimal diffs, package-manager discipline, tests, lint, typecheck, build, and reviewable commits. Use for feature work, refactors, dependency changes, releases, or code review.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Repository Quality

Read the relevant files before editing. Follow the repository’s own scripts and conventions instead of assuming a toolchain.

## Workflow

1. Inspect status, package manager, scripts, lockfiles, architecture, and relevant tests.
2. State the smallest coherent change and avoid unrelated cleanup.
3. Reuse existing dependencies and abstractions; add dependencies only with a clear need.
4. Validate external data at boundaries, preserve error context, and keep functions focused.
5. Run available tests, lint, typecheck, build, and packaging checks. Report commands and results honestly.
6. Review the diff for secrets, dead code, accidental files, backwards incompatibility, and documentation drift.

Protect user-edited files and never overwrite local work silently. For destructive or release operations, use a plan, explicit confirmation, and a reversible backup where practical.
