---
name: git-workflow
description: Plan and execute safe Git branching, commits, merges, rebases, cherry-picks, conflict resolution, and history repair. Use when changing branches, editing or dropping commits, rebasing, cherry-picking, reverting, cleaning a worktree, or pushing changes.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-26"
---
# Git Workflow and History Safety

Choose the least disruptive Git operation that achieves the requested result. A commit or push may affect teammates, releases, CI, or downstream clones; inspect the branch and worktree before acting.

## Procedure

1. Inspect `git status --short --branch`, `git branch -vv`, and recent graph history. Identify the current branch, upstream, staged/unstaged/untracked work, and whether commits are shared or published.
2. Preserve unrelated work. Do not reset, clean, stash-pop, switch over conflicting changes, or amend a commit until the affected paths and consequences are understood.
3. Prefer additive, reversible operations: a new branch, a new commit, `git revert` for published changes, and normal `git push` for shared branches.
4. For local unpushed commits, explain the exact effect before using `commit --amend`, interactive rebase, or cherry-pick. Keep a recovery reference when a multi-step history edit is authorized.
5. Before conflict resolution, inspect both sides and preserve intent. Afterward run `git diff --check`, relevant tests, and review the full staged diff.
6. Before committing, inspect `git diff --cached`, confirm only requested files are staged, and scan for secrets or generated artifacts. Use the repository's commit format.
7. Push only the requested branch and verify the remote branch and final worktree state.

## High-risk operations: require separate, explicit approval

Never run a destructive or history-rewriting command merely because it seems convenient. Before running any of these, state the exact command, target branch/commits/files, whether the branch is shared, what data or collaborators may be affected, and the safer alternative. Ask the user to approve that specific operation. A general request to "fix Git" or "clean up" is not approval.

High-risk operations include `git reset --hard`, `git clean` with deletion flags, dropping commits with interactive rebase, rebasing or amending commits already pushed/shared, deleting branches or tags, `git push --force` or `--force-with-lease`, and history-filtering tools. Do not proceed if upstream/shared status is uncertain.

For published commits, prefer `git revert <commit>` because it adds a compensating commit without rewriting history. `--force-with-lease` is safer than blind `--force`, but it still rewrites a remote ref and still requires the same explicit approval.

## Guardrails

- Never force-push a shared branch or rewrite published history without exact operation-specific approval.
- Never discard user changes to make a command succeed. Stop and report conflicts instead.
- Never use `git clean`, reset, or stash commands without inspecting the exact affected paths and status first.
- Never claim a push succeeded until the remote result and branch tracking state are verified.
- Never commit secrets, credentials, local environment files, or unrelated user changes.

## Gotchas

- A local branch name does not prove its commits are unpublished; compare with its upstream and inspect remote refs.
- Cherry-pick creates new commit IDs and may duplicate a commit that is already in the destination branch.
- Rebase changes commit IDs even when the patch content is unchanged.
- A clean working tree after a destructive command does not prove valuable work was not lost; verify the intended files and history.
- Resolve conflicts semantically, not by blindly choosing `ours` or `theirs` for every file.

Read `references/high-risk-commands.md` before a request involving reset, clean, rebase of shared work, commit removal, or force-push.

## Report format

State the branch, operation, commit(s), push result, checks run, and final worktree status. For a declined or blocked high-risk operation, explain the consequence and offer the safer reversible alternative.
