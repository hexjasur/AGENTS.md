# Repository quality checklists

Load this after `SKILL.md` when reviewing code, changing dependencies or CI, or preparing a release.

## Self-review before commit

- [ ] Diff contains only changes required by the task
- [ ] New and changed behavior has tests, including a failure path
- [ ] No debug logging, commented-out code, TODOs without owner, or dead code
- [ ] No secrets, tokens, personal data, `.env`, or generated artifacts
- [ ] Errors are handled with context; promises are awaited; external input is validated at the boundary
- [ ] Public API, config, and data-shape changes are intentional, documented, and backward compatible or flagged
- [ ] Docs, examples, changelog, and types match the behavior
- [ ] Format, lint, typecheck, tests, and build pass using the repository's own scripts

## Code review order

1. **Correctness:** does it do what was asked, including edge cases and failures?
2. **Security:** authorization, input validation, injection, secrets, new dependencies.
3. **Design:** fits existing architecture, no needless abstraction or duplication.
4. **Tests:** meaningful assertions, not only coverage.
5. **Performance and accessibility:** only where the change touches them.
6. **Readability:** names, comments that explain why, small functions.

Mark comments as blocking or optional. Suggest a concrete fix. Review the change, not the author.

## Dependencies

- [ ] Needed, or does the platform or an existing dependency already cover it?
- [ ] Exact package name verified (typosquatting), maintained, appropriate license, reasonable size
- [ ] Installed with the repository's package manager; lockfile diff reviewed
- [ ] Major upgrades read through release notes and migration guides, and tested
- [ ] Install and postinstall scripts reviewed for new packages
- [ ] Security advisories checked (`npm audit` or the ecosystem equivalent)

## CI and workflows

- [ ] Pin third-party actions to a full commit SHA; update them through automation
- [ ] Set `permissions:` to the minimum per workflow or job (default read-only)
- [ ] Never print or echo secrets; do not expose them to pull requests from forks
- [ ] Treat `pull_request_target` and untrusted input (`github.event.*` in shell) as injection risks
- [ ] Cache keys include the lockfile hash; builds are reproducible
- [ ] Required checks match what developers run locally

## Release checklist

Releases happen only on explicit instruction.

- [ ] Version bumped per semver (breaking = major, feature = minor, fix = patch)
- [ ] Changelog or release notes written
- [ ] Full verification passes on a clean checkout
- [ ] Package contents inspected (`npm pack --dry-run`) for stray or missing files
- [ ] Tag and publish through CI, using provenance where the registry supports it
- [ ] Rollback or deprecation plan known

## Destructive operations

State the plan, name what will be lost, take a reversible backup where practical, and wait for explicit confirmation before deleting data or files, rewriting history, running migrations, or touching production.

## Sources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements)
- [OpenSSF Scorecard](https://scorecard.dev/)
