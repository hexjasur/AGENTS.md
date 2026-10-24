# Design tokens and recipes

Load this after `SKILL.md` when creating a theme, a glass surface, or reviewing a screen. Replace the example colors with the product's own palette and re-check contrast.

## Tailwind v4 theme (CSS-first)

```css
@import "tailwindcss";

@theme {
  /* Warm, tinted dark neutrals */
  --color-surface: #14110f;
  --color-surface-raised: #1d1916;
  --color-surface-overlay: #26211d;
  --color-text: #f3ede6;
  --color-text-muted: #b8aea3;
  --color-border: #ffffff1a;
  --color-accent: #e8a35c;
  --color-accent-strong: #f4bd84;
  --color-danger: #f0776b;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --radius-sm: 0.5rem;
  --radius-md: 0.875rem;
  --radius-lg: 1.25rem;

  --ease-out-soft: cubic-bezier(0.22, 1, 0.36, 1);
}

:root {
  color-scheme: dark;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Use utilities like `bg-surface-raised text-text border-border`. Add a light theme by redefining the same tokens under a selector or `prefers-color-scheme`, so components never change.

## Glass surface recipe

```css
.glass {
  background: color-mix(in srgb, var(--color-surface-raised) 72%, transparent);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px #0000004d;
}

@supports (backdrop-filter: blur(1px)) {
  .glass {
    backdrop-filter: blur(16px) saturate(140%);
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .glass {
    background: var(--color-surface-raised); /* solid fallback keeps text readable */
  }
}
```

Checks: text over the panel has at least 4.5:1 contrast against the brightest backdrop it can sit on; blur stays between 12 and 24 px; no more than two large glass layers on screen.

## Scales

| Token | Suggested values |
| --- | --- |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 px |
| Type | 12, 14, 16, 18, 20, 24, 32, 40 px (use `clamp()` for headings) |
| Radius | 8, 14, 20 px, plus full for pills |
| Motion | 120 ms micro, 200 ms standard, 320 ms large; ease-out for entering, ease-in for leaving |
| Tap target | 44 px comfortable; never below 24 px |

## Motion rules

- Animate `transform` and `opacity`; avoid animating layout properties and blur radius.
- Entering elements decelerate (ease-out); leaving elements are faster than entering.
- Stagger lists by 30 to 50 ms at most, and cap total sequence length near 400 ms.
- Provide a way to reduce motion, and never convey state by motion alone.

## State matrix for every interactive component

| State | Required |
| --- | --- |
| Default | Clear affordance and label |
| Hover | Subtle change (not the only cue) |
| Focus-visible | High-contrast outline, 3:1 against adjacent colors |
| Active | Pressed feedback |
| Disabled | Reduced emphasis plus an explanation when helpful |
| Loading | Spinner or skeleton, prevent double submit |
| Error | Message, cause, and recovery action |
| Empty | Explanation and a primary next step |

## UI review checklist

- [ ] One primary action per view; secondary actions are visually quieter
- [ ] Spacing follows the scale; related items are grouped
- [ ] Text contrast 4.5:1 (3:1 for large text and UI parts) in every theme
- [ ] Focus visible and keyboard order matches visual order
- [ ] Works at 320 px width and at 200% zoom
- [ ] Loading, empty, and error states exist and read well
- [ ] Motion respects reduced-motion; no flashing
- [ ] Icons share one style and size grid
- [ ] Copy is specific and calm; no dead-end messages
- [ ] Glass and gradients stay readable on the lightest backdrop

## Sources

- [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/)
- [web.dev: Learn Design](https://web.dev/learn/design)
- [Tailwind CSS theme variables](https://tailwindcss.com/docs/theme)
- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [MDN: prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
