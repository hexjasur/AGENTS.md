# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]
### Added
- `error-handling-observability` and `git-workflow` skills, with focused eval prompts and operational references.
- Optional Claude Code, Cursor, and GitHub Copilot instruction bridges through `--agents`.
- Generated skill catalogs for `AGENTS.md` and README, checked by the verification script.
### Changed
- React guidance and project defaults now require URL synchronization for shareable route state, pagination, and browser navigation.
- Narrowed `.gitignore` environment patterns so files such as `env.d.ts` are not hidden.
### Fixed
- Corrected the README release download example and added a version-sync regression test.


## [1.5.0]

### Added

- Agent Skill linter CLI and reusable GitHub Action for metadata, links, review dates, and unsafe-content checks.
- Weekly source-link and freshness checks, OpenSSF Scorecard reporting, pinned GitHub Actions, and provenance attestations for release archives.
- OIDC trusted npm publishing when `package.json` version changes on `main`.

## [1.4.0]

### Added

- Skills: `renpy-visual-novel`, `renpy-ui-screens`, and `renpy-main-menu-design` (modern card-grid main menus) for Ren'Py visual novels and AVNs.
- Skills: `tauri-best-practices` and `tauri-auto-update` for Tauri v2 apps and signed, user-confirmed auto-updates through GitHub Releases.
- Skills: `react-typescript`, `ui-ux-design`, `testing-web`, and `github-actions`.
- Installer: `--skills <list>` and `--list-skills` to install only the skills you need.
- Eval prompts for every skill in `evals/`, validated by the test suite.
- Community files: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue and pull request templates, Dependabot for GitHub Actions, and a `ci.yml` workflow.
- Tests for skill trigger wording, size limits, reference linking, and secret and path hygiene.

### Changed

- README rewritten around who the project is for, with quick starts for web, Tauri, and Ren'Py developers.

## [1.2.1]

### Changed

- Optimized the README banner image and added a repository `.gitignore`.

## [1.2.0]

### Added

- The installer copies bundled skills into `.agent/skills` and asks for confirmation.
- Deeper `web-security`, `web-seo`, `repo-quality`, and `skill-authoring` skills, plus modernized `AGENTS.md`, `web-accessibility`, `web-performance`, and `modern-web-guidance`.

## [1.1.0]

### Added

- Downloadable skill and bundle archives published on GitHub Releases with checksums.
