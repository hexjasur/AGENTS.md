---
name: modern-web-guidance
description: Plan, build, review, or modernize web apps and pages with Baseline-aware native platform features, progressive enhancement, and measured performance, accessibility, security, and SEO outcomes. Use when adding web features, replacing legacy UI code or polyfills, choosing between a native API and a library, reviewing a web architecture, or before shipping a public page.
license: MIT
metadata:
  author: hexjasur
  version: "1.1.0"
  last_reviewed: "2026-10-25"
---

# Modern Web Guidance

Treat the web as a platform first. Prefer semantic HTML, native browser features, and progressive enhancement over framework workarounds, and tie every platform choice to an explicit browser-support target.

## Procedure

Copy this checklist and keep it updated:

```text
- [ ] 1. Discover: framework, build scripts, routes, browserslist, existing a11y/perf budgets
- [ ] 2. Set the target: Baseline level, devices, WCAG level, performance budget
- [ ] 3. Measure a production build before changing anything
- [ ] 4. Pick ONE workstream and activate its skill
- [ ] 5. Implement the smallest standards-based change
- [ ] 6. Verify: tests, lint/typecheck/build, keyboard, mobile + desktop viewport, re-measure
- [ ] 7. Report evidence, risks, follow-ups
```

1. **Discover** before editing. Read `package.json`, the bundler config, `browserslist`, and any docs that state supported browsers. Do not assume a framework or toolchain.
2. **Set the target.** If none is documented, propose one and record it in the project docs. Default proposal: Baseline *widely available* for production, WCAG 2.2 AA, Core Web Vitals "good" at p75 (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1).
3. **Measure.** Use a production build. With a URL, run Lighthouse for mobile and desktop; without one, rely on static checks and say so.
4. **One workstream at a time:** loading, interaction, layout stability, accessibility, security, or discoverability. Activate `web-performance`, `web-accessibility`, `web-security`, or `web-seo` accordingly.
5. **Implement** with native elements and APIs first. Gate anything outside the target with feature detection (`@supports`, `CSS.supports()`, `'api' in window`), never user-agent sniffing.
6. **Verify** against the target, not against the newest browser on your machine.

## Decision rules

- Native before custom: use `<button>`, `<dialog>`, `popover`, `<details>`, and form controls before rebuilding them. Read `references/native-first.md` when choosing an API for a UI pattern.
- Check support when you use a feature, not from memory. Look it up on [web.dev/baseline](https://web.dev/baseline) or MDN compatibility tables; Baseline status changes.
- Polyfills, dependencies, and abstractions need a reason tied to the support target. Remove polyfills the target no longer needs.
- Never trade accessibility or security for a visual shortcut. Skip speculative micro-optimizations.

## Gotchas

- Dev servers and unminified builds give misleading Lighthouse results; measure a production build.
- A single Lighthouse run is noisy. Compare medians of at least three runs under identical settings.
- Framework component libraries often wrap or replace native semantics (a custom modal that ignores `<dialog>`). Inspect the rendered DOM, not the component name.
- A feature that works in your browser can still be outside the target. Test the fallback path, not just the enhanced path.
- Client-side routing breaks assumptions about focus, titles, scroll restoration, and crawlability. Verify them after every navigation change.

## Report format

```text
Target: <Baseline level, devices, WCAG level, budgets>
Changed: <behavior and files>
Evidence: <before/after measurements or checks, with conditions>
Risks: <what is not covered>
Follow-ups: <next workstream>
```

## Definition of done

The change works at the stated support target, has an accessible keyboard path, adds no console errors or layout shift, protects sensitive data, and gives public routes an accurate title, metadata, and link structure.

Read `references/sources.md` for the official guidance behind this skill.
