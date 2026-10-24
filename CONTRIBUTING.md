# Contributing

Thanks for helping make coding agents better. This repository ships `AGENTS.md` and a set of focused Agent Skills. Good contributions are small, accurate, and based on official sources.

## Ways to contribute

- **Fix or sharpen a skill:** wrong facts, stale advice, unclear instructions, or a description that triggers at the wrong time.
- **Propose a new skill:** open a [skill request](https://github.com/hexjasur/AGENTS.md/issues/new?template=skill_request.yml) first. Describe what agents get wrong today and link the official documentation.
- **Improve the installer:** the Node.js CLI in `bin/` and `lib/`, with tests in `test/`.
- **Improve docs:** README, examples, and references.

## Development setup

Requires Node.js 18 or later. The package has no dependencies.

```sh
git clone https://github.com/hexjasur/AGENTS.md.git
cd AGENTS.md
npm run verify     # tests, skill validation, and a dry-run package listing
```

## Adding or changing a skill

Read `skills/skill-authoring/SKILL.md` first; it is the standard every skill here follows.

1. Create `skills/<name>/SKILL.md` with valid frontmatter. `name` must match the directory and use lowercase letters, numbers, and single hyphens.
2. Write a `description` of at most 1024 characters that says **what** the skill does and **when** to use it, and includes `Use when` or `Use for` plus the words people actually say.
3. Keep `SKILL.md` under 500 lines: procedure, guardrails, gotchas, and report format. Move long checklists, templates, and sources to `references/` and link each file from `SKILL.md` with a clear load condition.
4. Base facts on official documentation, link the sources, and avoid claims you did not verify. Do not hard-code fast-moving version numbers unless needed.
5. Add an eval file at `evals/<name>.json` with at least three prompts, including a casual phrasing, an edge case, and one that should **not** trigger the skill.
6. Add the skill to the table in `AGENTS.md` and to the README.
7. Run `npm run verify`. Everything must pass.

### Quality bar

- Only include what an agent would get wrong or not know without the skill.
- Prefer observable rules ("pin actions to a full SHA") over vague advice ("write secure workflows").
- No secrets, personal data, or machine-specific absolute paths.
- Code samples must be valid and safe by default.

## Pull requests

- One logical change per pull request and per commit.
- Use Conventional Commits: `type(scope): imperative summary` under 72 characters, with the reason in the body.
- State the problem, the approach, and how you verified it. The pull request template covers this.
- **Do not bump `package.json` version or edit `CHANGELOG.md` release headings unless you are the maintainer.** A version bump on `main` publishes a release automatically. Add your change under `## [Unreleased]` in `CHANGELOG.md`.

## Reporting security issues

Do not open a public issue. See [SECURITY.md](./SECURITY.md).

## Code of conduct

Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).
