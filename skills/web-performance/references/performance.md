# Performance checklist

## Measure

Run a production build. Record mobile and desktop Lighthouse reports when a URL is available. Inspect Core Web Vitals: LCP for loading, INP for responsiveness, and CLS for visual stability. Use a consistent viewport and network profile for before/after comparisons.

## Inspect

Check the critical request chain, render-blocking resources, image dimensions and formats, font loading, JavaScript bundle and hydration cost, long tasks, third-party scripts, cache headers, and repeated network requests. Pause work for hidden/off-screen UI.

## Verify

Confirm the LCP resource is prioritized correctly, no important content is hidden behind lazy loading, layout space is reserved, keyboard and pointer interactions remain responsive, and the optimized output is actually served in production.

## Sources

- [Modern Web Guidance 101](https://codelabs.developers.google.com/codelabs/modern-web-guidance-101)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [web.dev Performance](https://web.dev/learn/performance)
- [Web Vitals](https://web.dev/articles/vitals)
