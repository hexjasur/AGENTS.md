# High-Risk Git Command Review

This reference is a decision checklist, not authorization. User approval must be obtained for the exact operation before execution.

## `git reset --hard`

This moves the current branch/index and discards tracked working-tree changes. First capture status and inspect staged/unstaged diffs. Ask which commit the branch should point to, name the affected branch, and explain that local changes may be lost. Prefer a new branch or a revert when preserving history matters.

## `git clean -fd` and variants

These delete untracked files/directories that Git does not track, which can include ignored local data. Run `git clean -nd` only to preview, inspect each path, then ask before deletion. Do not use `-x`/`-X` without explaining that ignored files such as build outputs or local configuration can be removed.

## Rebase, amend, and dropping commits

Determine whether target commits are reachable from an upstream or used by another person/automation. Local-only commits can be rewritten only after the user approves the exact plan. Rebasing shared commits requires explicit approval because it changes IDs and requires coordinated updates. Prefer `git revert` for published work.

## Force push

A force push replaces the remote branch tip and can make teammates' commits disappear from normal history. Show the exact remote and branch, inspect divergence, explain coordination/recovery impact, and ask for explicit approval. `--force-with-lease` prevents overwriting an unexpected update but does not make rewriting harmless.

## Deleting branches and tags

Confirm the exact local/remote ref, whether it has unmerged commits, and whether a tag points to a released artifact. Prefer archiving or keeping a branch when uncertain. Remote deletion can disrupt CI, releases, or collaborators.

## Recovery

Before an approved multi-step history edit, note the current commit ID and consider a temporary recovery branch. Afterward verify `git status`, `git log --graph`, `git diff` against the intended base, and relevant tests. Do not promise that reflog recovery is permanent.
