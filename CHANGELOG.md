# Changelog

All notable changes are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.4.0]

### Added

- Skills: `renpy-visual-novel` and `renpy-ui-screens` for Ren'Py visual novels and AVNs.
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
