---
name: modern-web-guidance
description: Build, review, or modernize web applications with interoperable platform APIs, Baseline-aware decisions, performance, accessibility, security, and SEO. Use for new web features, legacy UI modernization, architecture reviews, or before shipping a public web page.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Modern Web Guidance

Treat the web as a platform first. Prefer semantic HTML, native browser capabilities, progressive enhancement, and standards with an explicit browser-support target over framework-specific workarounds.

## Workflow

1. Inspect the project, framework, build scripts, routes, and browser-support policy before changing code.
2. State the target: supported browsers/Baseline level, device priorities, accessibility target, and performance budget.
3. Establish a baseline with a production build and, when a URL is available, Lighthouse on mobile and desktop. Do not implement changes from guesses alone.
4. Group findings into one priority at a time: loading, interaction, layout stability, accessibility, security, or discoverability.
5. Prefer the smallest standards-based change. Preserve progressive enhancement and graceful failure when an API is unavailable.
6. Verify with tests, typecheck/lint/build, Lighthouse or focused browser checks, keyboard navigation, and responsive viewports.
7. Report changed behavior, measured evidence, remaining risks, and follow-up work.

## Decision rules

- Use native elements and APIs (`button`, `dialog`, `details`, form controls, View Transitions where appropriate) before recreating them with JavaScript.
- Do not add a polyfill, dependency, or abstraction without checking browser support and project constraints.
- Never trade accessibility or security for a visual shortcut. Avoid speculative micro-optimizations.
- For a focused workstream, activate the matching bundled skill: `web-performance`, `web-accessibility`, `web-security`, or `web-seo`.

## Definition of done

The change works at the stated support target, has an accessible interaction path, introduces no obvious console errors or layout shift, protects sensitive data, and gives public routes accurate title, metadata, and link structure.

Read `references/sources.md` for the official guidance used by this skill.
