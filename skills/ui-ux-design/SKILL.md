---
name: ui-ux-design
description: Design and review polished, accessible user interfaces with design tokens, type and spacing scales, color roles and contrast, warm dark themes, glass and blur surfaces, motion, responsive layouts, and complete empty, loading, and error states, with Tailwind-friendly tokens. Use when building or restyling screens, creating or extending a design system, choosing colors or typography, adding animation or glassmorphism, or reviewing UI quality for web, Tauri, or app interfaces.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# UI and UX Design

Decide the system before the screens: tokens, hierarchy, and states. Make the interface clear first, then distinctive.

## Procedure

```text
- [ ] 1. State the user, the main task, and the tone of the product
- [ ] 2. Define tokens: color roles, type scale, spacing, radius, elevation, motion
- [ ] 3. Lay out hierarchy: one primary action per view, grouped by proximity
- [ ] 4. Design every state: default, hover, focus, active, disabled, loading, empty, error
- [ ] 5. Add depth and motion with restraint
- [ ] 6. Check contrast, responsiveness, and reduced-motion; then review with fresh eyes
```

1. Write one sentence on who uses the screen, what they need to finish, and the feeling it should have (calm, playful, technical). Every later choice must serve it.
2. Tokens first: semantic color roles (`surface`, `surface-raised`, `text`, `text-muted`, `accent`, `danger`, `border`), a type scale, a 4 or 8 px spacing scale, a small set of radii, and motion durations. Components consume tokens, never raw values. Examples are in `references/design-tokens.md`.
3. One primary action per view; make everything else visually quieter. Use size, weight, contrast, and whitespace for hierarchy before adding color.
4. Design all states, including focus and keyboard, empty states with a next step, loading skeletons, and errors that explain how to recover.
5. Use elevation, blur, and gradients to support hierarchy, not decoration. Animate `transform` and `opacity` for 150 to 250 ms with ease-out, and respect `prefers-reduced-motion`.
6. Check contrast (text 4.5:1, large text and UI parts 3:1), tap targets, 320 px width, and zoom; then squint test: can you still see the hierarchy?

## Guardrails

- Never rely on color alone for meaning, and never use low-contrast gray text for essential content.
- Never mix many radii, shadows, or accent colors; limit to the tokens.
- Never put text over busy images or blurred backgrounds without a scrim or enough contrast.
- Never remove focus indicators. Provide a clear `:focus-visible` style.
- Never ship hover-only affordances; touch and keyboard users need the same access.
- Do not use motion that flashes more than three times per second, and do not block interaction with long animations.
- Do not use more than two typeface families; do not use tiny text (under 14 px) for body content.

## Gotchas

- Warm dark themes work best with tinted neutrals (a hint of brown or purple) instead of pure `#000` and `#fff`. Raise elevation by making surfaces slightly lighter, not by adding heavy shadows.
- Glass surfaces need something worth blurring behind them. Use a translucent fill, a 1 px low-opacity border, `backdrop-filter: blur()` with a solid fallback under `@supports not (backdrop-filter: blur(1px))`, and verify text contrast against the lightest part of the backdrop.
- Blur is expensive. Limit large blurred layers, avoid animating blur radius, and test on low-end devices; consider `prefers-reduced-transparency` where supported.
- Gradients should be subtle (low hue shift, similar luminance) or text contrast breaks across the gradient.
- Dark mode is not inverted light mode: re-check contrast, shadows (use borders and lighter surfaces), and image brightness.
- Use `clamp()` for fluid type, keep line length around 60 to 75 characters, and line height around 1.4 to 1.6 for body text.
- Icons must share a style, stroke width, and size grid (Lucide works well for consistency). Pair icons with text labels where meaning is not obvious.
- Spacing is the cheapest polish: align to the scale, group related items closer than unrelated ones, and keep consistent paddings.
- Responsive does not mean shrinking. Reflow, change density, and move secondary content, using container queries for components.
- Empty and error states are product moments; write human, specific copy with one clear action.

## Review format

List issues by impact (blocks users, accessibility, hierarchy and clarity, consistency, polish), each with the screen or component, the problem, and a concrete fix using the tokens. Say what was checked (contrast, keyboard, widths, motion settings) and what was not.

Read `references/design-tokens.md` for a Tailwind v4 token theme, a glass surface recipe, motion rules, and a UI review checklist. Pair this skill with `web-accessibility` for audits and `react-typescript` for component code.
