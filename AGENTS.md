# AGENTS.md

Global rules for AI coding agents working in this project. Read this file before starting a task, then load the relevant skill from `skills/` when the task matches its description.

## Operating principles

- Read the task, repository status, relevant code, and tests before editing.
- Make the smallest coherent change. Preserve user work and do not overwrite edited files silently.
- Follow the package manager declared by `package.json` or the existing lockfile. Never create a second lockfile.
- Prefer existing dependencies and abstractions. Validate external data at boundaries and preserve useful error context.
- Raise a flawed architecture early with the problem, reasoning, and a concrete alternative; the developer makes the final decision.
- Keep secrets out of source, logs, commits, examples, and generated artifacts.

## Verification

- Discover available scripts before running checks. Run the relevant test, lint, typecheck, build, and packaging commands that exist.
- Review the final diff for unrelated changes, dead code, accidental files, security issues, and documentation drift.
- Report what changed, why, and which checks passed or were unavailable. Never claim a check ran when it did not.

## Skills

Use these project skills for specialized workflows:

- `repo-quality` for safe repository changes, reviews, and release checks.
- `modern-web-guidance` for web architecture and modernization.
- `web-performance` for loading, responsiveness, and Core Web Vitals.
- `web-accessibility` for semantic HTML, keyboard support, forms, and inclusive UI.
- `web-security` for input boundaries, authentication, browser security, and deployment hardening.
- `web-seo` for public routes, crawlability, metadata, links, and structured data.
- `skill-authoring` for creating or improving Agent Skills.

Skills are progressive-disclosure modules. Load only the matching `SKILL.md`; follow its references only when the task requires them.

## TypeScript and JavaScript

- Avoid `any`; use `unknown` with narrowing or precise generics.
- Keep exported APIs and important boundaries explicitly typed.
- Do not suppress errors with `@ts-ignore`, `@ts-nocheck`, or blanket lint disables.
- Use `const`, clear names, and early returns. Do not leave dead code or stray debug logging.

## Commits

Keep each commit to one logical change and use the repository’s established commit convention. Never commit `.env`, tokens, credentials, or private user data.

## Context

Version: 1.1.0
Founder: [hexjasur](https://github.com/hexjasur)
