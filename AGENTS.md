# AGENTS.md

Mandatory rules for all AI agents working in this project. Read this file before starting any task.

---

## 1. Package Manager

Use **only** the package manager already used in the project. All others, including their `npx`/`bunx`/`dlx`-style equivalents, are **forbidden**.

Detection: the `packageManager` field in `package.json`; if absent, the lockfile:

- `bun.lock` / `bun.lockb` → bun
- `pnpm-lock.yaml` → pnpm
- `yarn.lock` → yarn
- `package-lock.json` → npm

Example: if the project uses bun, npm is forbidden. Never create a second lockfile.

---

## 2. TypeScript

- **`any` is forbidden** (`: any`, `as any`, `any[]`, `Record<string, any>`). When a type is unknown, use `unknown` with narrowing, or generics.
- **Never leave code untyped.** Parameters, props, state, and the return types of exported functions must be explicitly typed.
- Suppressing errors with `@ts-ignore`, `@ts-nocheck`, or `eslint-disable` is forbidden.
- **`.ts` and `.tsx` files must have zero errors.** Before finishing any task, typecheck and lint must pass with 0 errors (e.g. `bun run typecheck && bun run lint`).

---

## 3. Commit Format

```
<type>(<scope>): <short imperative subject> <emoji>
```

The scope is optional (e.g. `export`, `trapezoid`, `rk4`, `i18n`, `deps`). The subject uses the imperative mood (`add`, `fix`, `replace`) and ends with exactly one emoji.

| Type | When to use | Emoji |
| --- | --- | --- |
| `feat` | New user-facing feature | ✨ |
| `fix` | Bug fix | 🐛 |
| `refactor` | Code restructuring with no behavior change | ♻️ |
| `perf` | Performance improvement | ⚡️ |
| `style` | Formatting / UI polish only | 🎨 |
| `chore` | Tooling, deps, config, CI | 🧹 / 🔧 |
| `docs` | Documentation only | 📝 |
| `test` | Adding or fixing tests | ✅ |

Additional emoji: 🚀 deploy/release, ➕ add dependency, ➖ remove dependency.

Examples:

```
fix(export): replace html-to-image with modern-screenshot, add PNG timestamp 🐛
feat(rk4): add CSV/PNG export toolbar to Runge-Kutta page ✨
chore(deps): bump modern-screenshot to 4.7.0 ➕
refactor(plot): extract QuadraturePlot into shared integration component ♻️
```

Keep each commit to one logical change. Never commit secrets (`.env`, tokens).

---

## 4. DRY

Extract duplicated logic **the moment it is written a second time** (util, hook, or shared component). Do not wait for a third occurrence.

---

## 5. Architecture

- If a more convenient or sounder architecture exists, **suggest it** to the developer.
- If the developer is heading toward a flawed architecture or approach, **raise it immediately**: state the problem, the reasoning, and a concrete alternative. Do not continue down that path until the developer has clarified their decision.
- The final decision belongs to the developer. Once they confirm, proceed with their choice.

---

## 6. Code Quality

- Keep functions small and single-purpose; prefer early returns.
- Use clear names; prefix booleans with `is/has/can/should`.
- Prefer `const`; never use `var`; replace magic numbers with named constants.
- Leave no dead code, unused imports, or stray `console.log` statements.
- Never swallow errors: use `catch (error: unknown)` and narrow with `instanceof Error`.
- Validate external data (APIs, JSON) at runtime (e.g. with `zod`).
- Follow the existing folder structure and naming conventions.
- Verify that a new dependency is truly needed before adding it.

---

## 7. Workflow

1. Read the task and the relevant code first; do not guess.
2. Make only the requested changes.
3. Typecheck, lint, tests, and build must all pass with 0 errors (Section 2).
4. Commit using the format in Section 3.
5. Give a brief report: what changed and why.
6. **After every completed task**, follow the report with two lists (exactly 4 items each, one line per item):
   - **Extend this task:** 4 ideas directly related to the work just done.
   - **New project features:** 4 new project-wide capabilities (UX, DX, performance, new functionality).

If a requirement is unclear, ask instead of assuming.

---

Context version: v0.1
Founder: [hexjasur](https://github.com/hexjasur)
