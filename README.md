# @hexjasur/agents-md

A safe, cross-platform installer for project-level `AGENTS.md` instructions and a curated bundle of modular [Agent Skills](https://agentskills.io/specification) for coding agents.

The package separates two layers:

- `AGENTS.md` contains short, project-wide rules that should apply to every task.
- `skills/<name>/SKILL.md` contains a focused capability that an agent loads only when its description matches the task.

The included web guidance is based on Google Chrome Modern Web Guidance, Lighthouse, web.dev, MDN, and Google Search Central. It covers modern platform-first development, performance, accessibility, security, and SEO.

## Quick start

Requirements: Node.js 18 or later.

Install the bundled project instructions into the current directory:

```sh
npx -y @hexjasur/agents-md
```

Install into a specific project, or update a previous installation:

```sh
npx -y @hexjasur/agents-md init ./my-app
npx -y @hexjasur/agents-md update ./my-app
```

From a source checkout:

```sh
./install-agents.sh init ../my-project
./install-agents.sh update ../my-project
```

## Included skills

| Skill | Use it for |
| --- | --- |
| `modern-web-guidance` | Baseline-aware web architecture, native platform APIs, modernization, and release readiness |
| `web-performance` | Lighthouse, Core Web Vitals, loading, responsiveness, images, fonts, and layout stability |
| `web-accessibility` | Semantic HTML, keyboard interaction, focus, forms, dialogs, contrast, and inclusive UI |
| `web-security` | HTTPS, cookies, input validation, auth boundaries, CORS, CSP, uploads, and secrets |
| `web-seo` | Crawlability, metadata, links, canonical URLs, sitemap, robots, and structured data |
| `repo-quality` | Minimal diffs, package-manager discipline, tests, builds, releases, and code review |
| `skill-authoring` | Creating, validating, evaluating, and splitting Agent Skills |

Skills follow progressive disclosure: the catalog exposes metadata first, `SKILL.md` loads on activation, and `references/` files are read only for the relevant workstream.

## Installation layout

The current CLI installs `AGENTS.md` and records its version and SHA-256 hash in `.agent/hexjasurs.agent.scheme.json`:

```text
my-app/
├── AGENTS.md
└── .agent/
    └── hexjasurs.agent.scheme.json
```

The npm package also contains the reusable skill source:

```text
skills/
├── modern-web-guidance/
│   ├── SKILL.md
│   └── references/
├── web-performance/
├── web-accessibility/
├── web-security/
├── web-seo/
├── repo-quality/
└── skill-authoring/
```

At this release, the CLI’s safe installer manages `AGENTS.md`. The skill directories are distributed as package assets so compatible clients can discover and install them. Per-project skill syncing is planned for a future CLI command; do not assume `skills install` exists yet.

## Safety model

Existing `AGENTS.md` files are never overwritten implicitly. Interactive `init` can cancel, delete, or replace after an explicit choice. `update` compares the installed file’s SHA-256 hash with the manifest and stops if local edits are detected unless `--force` is supplied.

The hash detects accidental or local edits; it is not a digital signature. Run the CLI from a trusted source and review the package before using it in sensitive repositories. Symlinked managed files and manifest paths are rejected.

## CLI

```text
npx -y @hexjasur/agents-md [init] [directory]
npx -y @hexjasur/agents-md update [directory] [--force]
npx -y @hexjasur/agents-md --help
npx -y @hexjasur/agents-md --version
```

The directory defaults to the current working directory. `init` is the default command.

## Development

```sh
npm test
npm run validate:skills
npm run verify
npm pack --dry-run
```

`validate:skills` uses the Agent Skills reference validator bundled with the development environment. Before publishing, inspect the tarball and verify that `skills/` is included.

## Design principles

Keep skills coherent and short. Put non-obvious procedures in `SKILL.md`, detailed variants in `references/`, deterministic repeated work in `scripts/`, and reusable output files in `assets/` or templates. Do not turn one skill into a general encyclopedia.

For web work, choose and document a Baseline target, measure before optimizing, preserve semantic and keyboard-accessible behavior, protect every trust boundary, and validate public routes as rendered pages. A Lighthouse score is evidence for investigation, not a substitute for real-user data or functional testing.

## Official references

- [Agent Skills specification](https://agentskills.io/specification)
- [Google Chrome Modern Web Guidance 101](https://codelabs.developers.google.com/codelabs/modern-web-guidance-101)
- [Modern Web Guidance repository](https://github.com/GoogleChrome/modern-web-guidance)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [web.dev Learn](https://web.dev/learn)
- [Google Search SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web)

## Links

- Repository and issues: [hexjasur/AGENTS.md](https://github.com/hexjasur/AGENTS.md)
- License: MIT
