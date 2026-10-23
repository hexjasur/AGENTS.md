# Performance reference

## Measure

- Always use a production build. Record device profile (for example, mobile with 4x CPU slowdown), network throttling, and URL.
- Lab: Lighthouse, DevTools Performance panel, WebPageTest. Field: CrUX, PageSpeed Insights, RUM via the `web-vitals` library.
- Lighthouse cannot measure INP. Use Total Blocking Time in the lab and real-user INP in the field.
- Median of at least three runs; keep throttling constant.

## Cause-to-fix map

### LCP (loading)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Long "resource load delay" | LCP image discovered late (set by JS, CSS background, lazy-loaded) | Put it in HTML as `<img>`; add `fetchpriority="high"`; remove `loading="lazy"` |
| Long "resource load duration" | Oversized or unoptimized image | Responsive `srcset`/`sizes`, AVIF/WebP, correct dimensions, CDN |
| Long "element render delay" | Render-blocking CSS/JS, client-side rendering | Inline critical CSS, defer scripts, server-render or pre-render above-the-fold content |
| High TTFB | Slow server, no caching, redirects | Cache at CDN, remove redirect chains, optimize backend, use streaming SSR |

### INP (interaction)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Long input delay | Main thread busy with long tasks | Split work (`scheduler.yield()` or `setTimeout` fallback), defer non-critical JS |
| Slow event handlers | Heavy synchronous work in handlers | Do the minimum to update the UI, defer the rest; move compute to a Web Worker |
| Slow presentation | Large DOM, expensive layout and style recalculation | Reduce DOM size, `content-visibility: auto`, avoid layout thrash |
| Hydration jank | Hydrating everything at once | Partial/selective hydration, islands, lazy hydrate off-screen components |

### CLS (stability)

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Images or embeds shift | Missing dimensions | Set `width`/`height` or `aspect-ratio` |
| Text reflows after font load | Fallback font metrics differ | `font-display` plus `size-adjust`, `ascent-override` fallbacks |
| Content jumps | Late-injected banners, ads, consent UI | Reserve space; insert below the fold or use overlays that do not displace content |
| Animations shift layout | Animating `top`/`height`/`margin` | Animate `transform` and `opacity` only |

## Inspect

Critical request chain and render-blocking resources; image format, dimensions, and priority; font loading; bundle size and unused JS (coverage tab); long tasks; third-party cost; cache headers (`Cache-Control`, immutable hashed assets); compression (Brotli/gzip); repeated or waterfall requests; bfcache eligibility (avoid `unload` handlers and `Cache-Control: no-store` where possible).

## Prevent regressions

Add a performance budget (bundle size or Lighthouse CI assertions), track field Core Web Vitals, and review the cost of every new dependency and third-party tag before merging.

## Verify

Confirm the LCP resource is discovered and prioritized correctly, nothing important is hidden behind lazy loading, layout space is reserved, interactions stay responsive on a throttled CPU, and the optimized output is what production actually serves.

## Sources

- [Web Vitals](https://web.dev/articles/vitals)
- [Optimize LCP](https://web.dev/articles/optimize-lcp), [Optimize INP](https://web.dev/articles/optimize-inp), [Optimize CLS](https://web.dev/articles/optimize-cls)
- [web.dev Performance](https://web.dev/learn/performance)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [web-vitals library](https://github.com/GoogleChrome/web-vitals)
- [Modern Web Guidance 101](https://codelabs.developers.google.com/codelabs/modern-web-guidance-101)
