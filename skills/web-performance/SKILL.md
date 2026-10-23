---
name: web-performance
description: Audit and improve web loading, responsiveness, and layout stability using production measurements, Core Web Vitals (LCP, INP, CLS), and Lighthouse. Use when pages feel slow, Lighthouse or field data flags a regression, or when optimizing bundles, images, fonts, third-party scripts, hydration, or caching.
license: MIT
metadata:
  author: hexjasur
  version: "1.1.0"
---

# Web Performance

Measure first, change one thing, measure again. Use a production build and a consistent device and network profile so before/after numbers are comparable.

## Targets (75th percentile of real users)

| Metric | Good | Needs improvement | Poor |
| --- | --- | --- | --- |
| LCP (loading) | ≤ 2.5 s | ≤ 4 s | > 4 s |
| INP (responsiveness) | ≤ 200 ms | ≤ 500 ms | > 500 ms |
| CLS (visual stability) | ≤ 0.1 | ≤ 0.25 | > 0.25 |

Use the project's own budget if one exists. Lighthouse is lab data and does not measure INP; use field data (CrUX, RUM, PageSpeed Insights) when available and Total Blocking Time as a lab proxy.

## Procedure

```text
- [ ] 1. Record URL/build, device profile, network throttling, and baseline metrics
- [ ] 2. Find the worst metric and its cause (trace, not guess)
- [ ] 3. Fix the root cause with the smallest change
- [ ] 4. Re-run the identical measurement (median of 3+ runs)
- [ ] 5. Confirm behavior still works; add a budget or CI check to prevent regression
```

1. Run `npx lighthouse <url> --preset=desktop` and the default mobile profile against a production build, or use the DevTools Performance panel. Save the numbers.
2. Diagnose by metric, using `references/performance.md` for the cause-to-fix map:
   - **LCP:** identify the LCP element, then fix its discovery (in the HTML, not injected by JS), priority (`fetchpriority="high"`), size and format, and server response time.
   - **INP:** find long tasks and slow event handlers; break up work, defer non-critical JS, reduce hydration and DOM size.
   - **CLS:** find shifting elements; reserve space with `width`/`height` or `aspect-ratio`, size font fallbacks, never insert content above existing content.
3. Fix the biggest contributor first. Do not stack unrelated optimizations in one change.
4. Compare under identical conditions and report the delta with the conditions.

## Guardrails

- Never lazy-load the LCP image or hide first-paint content behind JS.
- Use `preload` only for a resource the browser cannot discover early and that is truly critical; unused preloads cost bandwidth.
- Prefer modern image formats (AVIF/WebP) with `srcset`/`sizes`, explicit dimensions, and `decoding="async"` for non-LCP images.
- Self-host and subset fonts; use `font-display: swap` or `optional` with a metric-matched fallback (`size-adjust`).
- Budget third-party scripts: load with `async`/`defer`, after interaction, or off the main thread. Remove tags nobody owns.
- Keep animation to `transform` and `opacity`; honor `prefers-reduced-motion`.

## Gotchas

- Scores swing between runs; a 3-point change is noise. Use medians and fixed throttling.
- A fast score on localhost says nothing about production: check compression (Brotli), HTTP caching, CDN, and the HTTP version actually served.
- Code-splitting can hurt if it creates a request waterfall for above-the-fold UI. Verify the critical path in the network trace.
- `loading="lazy"` on a hero image or `<link rel=preload>` for everything are the two most common self-inflicted LCP regressions.
- Perceived speed counts: skeletons and optimistic UI do not fix a slow LCP, so report real metrics.
- Do not trade accessibility for speed (for example, removing focus styles or dropping alt text).

## Report format

```text
Baseline: <metric values, device/network, build>
Cause: <what the trace showed>
Change: <files and what changed>
After: <same metrics, same conditions>
Regression guard: <budget, CI check, or monitoring>
```

Read `references/performance.md` for the cause-to-fix map, tooling, and sources.
