# Native-first decision table

Candidates, not guarantees. Confirm support for the project's Baseline target before using any row, and keep the fallback in the last column.

| Need | Prefer | Fallback or caveat |
| --- | --- | --- |
| Modal dialog | `<dialog>` with `showModal()` | Provides focus containment, `Esc`, and the top layer. Style `::backdrop`; restore focus to the opener on close. |
| Menu, tooltip, or non-modal overlay | Popover API (`popover`, `popovertarget`) | Light dismiss and top layer are built in. Add `aria-expanded` only if the control is not a native popover invoker. |
| Disclosure or accordion | `<details>` / `<summary>`; shared `name` for exclusive groups | Do not rebuild with `div` and `aria-expanded` unless animation needs force it. |
| Anchored positioning | CSS anchor positioning | Check Baseline status; fall back to a simple static position. |
| Component-level responsiveness | Container queries (`@container`) | Use media queries for page-level layout only. |
| Style a parent from a child state | `:has()` | Keep the unstyled state usable. |
| Form validation feedback | Constraint Validation API, `:user-invalid`, `:user-valid` | Keep server validation; show errors in text, not color alone. |
| Page or view transitions | View Transitions API | Feature-detect (`document.startViewTransition`); the navigation must work without it. |
| Scroll-linked effects | CSS scroll-driven animations | Treat as enhancement; honor `prefers-reduced-motion`. |
| Lazy loading | `loading="lazy"` on below-the-fold images and iframes | Never on the LCP image. |
| Theming | `color-scheme`, `light-dark()`, custom properties | Set `<meta name="color-scheme">` to avoid a flash. |
| Typography | `text-wrap: balance` / `pretty`, `font-display`, `size-adjust` | Safe progressive enhancements. |
| Data formatting | `Intl.DateTimeFormat`, `Intl.NumberFormat`, `Intl.RelativeTimeFormat` | Drop date and number formatting libraries when `Intl` covers the need. |
| Network cancellation | `fetch` with `AbortController` / `AbortSignal.timeout()` | Cancel stale requests on navigation and input changes. |
| Off-main-thread work | Web Workers | Avoid for tiny tasks; message-passing overhead can exceed the gain. |
| Faster next navigation | Speculation Rules (prefetch/prerender) | Progressive enhancement; avoid prerendering pages with side effects. |
| Copy, share, files | Clipboard API, Web Share, File System Access | Require user gestures and secure contexts; always keep a manual path. |

## Anti-patterns to replace

- Clickable `div`/`span` elements → `<button>` or `<a href>`.
- Hand-rolled focus traps and scroll locks → `<dialog>` or `inert` on the background.
- Scroll listeners for reveal or sticky effects → `IntersectionObserver`, `position: sticky`, or scroll-driven animations.
- Resize listeners that switch layouts → container or media queries.
- `moment`/large date libraries for formatting → `Intl` (and a small library only for complex arithmetic).
- Always-on animation libraries for simple transitions → CSS transitions and `@starting-style`.
