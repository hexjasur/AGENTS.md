---
name: testing-web
description: Design, write, and stabilize automated tests for web and Tauri frontends with Vitest, Testing Library, Playwright, and Mock Service Worker, including what to test, accessible queries, network mocking, end-to-end flows, visual and accessibility checks, flaky-test fixes, and CI setup. Use when adding or reviewing tests, fixing flaky or slow tests, choosing between unit, component, and end-to-end tests, or setting up test tooling and CI.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# Web Testing

Test behavior users depend on, at the cheapest level that proves it. A small, reliable suite beats a large, flaky one.

## Procedure

```text
- [ ] 1. Identify the behavior and the risk it protects
- [ ] 2. Pick the cheapest level: unit, component, or end-to-end
- [ ] 3. Write the failing test first for bugs; then fix
- [ ] 4. Query like a user; mock only the boundaries
- [ ] 5. Make it deterministic: no sleeps, no shared state, controlled time and network
- [ ] 6. Run in CI with traces and reports; quarantine nothing silently
```

1. Ask what breaks for a user or business if this fails. Test that, not implementation details.
2. Pure logic gets unit tests. Components with interaction get component tests (Vitest with Testing Library, jsdom or a real browser). Critical journeys (sign in, checkout, save, update flow) get a few Playwright end-to-end tests.
3. For a bug, reproduce it with a failing test, then fix. Keep the test as a regression guard.
4. Prefer `getByRole`, `getByLabelText`, and visible text over test IDs and CSS selectors. Use `user-event` for interactions. Mock the network with MSW and keep real code paths for everything else.
5. Await with `findBy*` and `expect(...).toPass()` or Playwright auto-waiting; never use fixed sleeps. Reset state per test, use fake timers for time, and isolate data.
6. Run `vitest run` (not watch mode) and Playwright in CI, upload traces and HTML reports as artifacts, and fail the build on flakiness instead of retrying blindly.

## Guardrails

- Never skip, delete, or loosen a test to make a build pass; fix the cause or open an issue and report it.
- Never assert on internal state, private functions, or snapshots of large DOM trees.
- Never depend on test order, shared mutable state, real clocks, real third-party services, or production data.
- Never use arbitrary `waitForTimeout` or `setTimeout` in tests.
- Never commit secrets or real credentials in fixtures; use dedicated test accounts and env vars.
- Do not chase coverage numbers; cover behavior and risk, and review what the number leaves out.

## Gotchas

- `getBy*` throws if missing, `queryBy*` returns `null` (use for absence), `findBy*` waits. Using the wrong one causes flaky or false-passing tests.
- Wrap state updates correctly: use Testing Library's async utilities instead of manual `act` when possible.
- Test at accessible roles. If a role query is hard, the UI probably has an accessibility problem worth fixing.
- Playwright: use locators (`page.getByRole`), rely on auto-wait and web-first assertions (`await expect(locator).toBeVisible()`), and avoid `page.waitForTimeout`.
- Reuse sign-in state with `storageState` and run tests in parallel with isolated contexts.
- Visual snapshots differ by OS and fonts; generate and compare them in the same container image used in CI.
- Add automated accessibility checks (`@axe-core/playwright` or `jest-axe`), but remember they find only part of the issues.
- Fake timers and MSW need cleanup between tests (`afterEach`), or state leaks to the next test.
- jsdom lacks layout, `IntersectionObserver`, and real CSS; use a real browser (Playwright or Vitest browser mode) for layout-dependent behavior.
- For Tauri frontends, mock the native bridge with `@tauri-apps/api/mocks` (`mockIPC`) in component tests, and test Rust commands separately with Tauri's mock runtime.
- A flaky test is a bug in the test or the app. Reproduce with repeat runs (`--repeat-each`), read the trace, and fix the race.

## Report format

State what was tested and at which level, which behaviors remain untested, commands run with results, and any flaky or slow tests found with the cause and the fix or the follow-up.

Read `references/testing-reference.md` for configuration, example tests, MSW setup, Playwright config, and CI snippets.
