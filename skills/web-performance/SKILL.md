---
name: web-performance
description: Audit and improve web loading, responsiveness, and layout stability using production measurements, Core Web Vitals, and Lighthouse. Use when pages feel slow, optimizing bundles, images, fonts, or preventing performance regressions.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Web Performance

Measure before changing code. Test a production build on a representative mobile viewport, then compare desktop when relevant.

## Workflow

1. Record the URL/build, device profile, network conditions, and current Lighthouse/Core Web Vitals results.
2. Prioritize user-visible bottlenecks: LCP/loading, INP/interaction, CLS/layout stability, then secondary optimizations.
3. Fix the root cause with the smallest change: reduce critical bytes, optimize images and fonts, split non-critical JavaScript, remove long main-thread work, and reserve layout space.
4. Keep off-screen work paused. Avoid unbounded polling, unnecessary hydration, and animation that competes with input.
5. Re-run the same audit and verify functionality, bundle output, and before/after measurements.

## Guardrails

- Do not lazy-load the LCP resource or hide content needed for first paint.
- Prefer responsive images, explicit dimensions, deliberate font fallbacks, and `preload` only for truly critical resources.
- Treat scores as diagnostic signals; inspect the failing audit and real-user data when available.
- Read `references/performance.md` for the audit checklist and source links.
