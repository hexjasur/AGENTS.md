---
name: web-accessibility
description: Build and audit accessible web pages and components against WCAG 2.2 AA with semantic HTML, keyboard support, focus management, form errors, contrast, and screen-reader-friendly states. Use for UI work, dialogs, menus, navigation, forms, custom widgets, and accessibility audits or bug reports.
license: MIT
metadata:
  author: hexjasur
  version: "1.1.0"
  last_reviewed: "2026-10-25"
---

# Web Accessibility

Start with native semantics. Add ARIA only when HTML cannot express the behavior, and make every interaction work without a pointer. Target WCAG 2.2 AA unless the project states otherwise.

## Procedure

```text
- [ ] 1. Identify the user task and the semantic structure
- [ ] 2. Keyboard pass: tab order, visible focus, Esc, no traps or dead ends
- [ ] 3. Names, roles, states, errors, and live updates
- [ ] 4. Visual pass: contrast, zoom/reflow, motion, target size
- [ ] 5. Automated scan, then manual confirmation
- [ ] 6. Re-test failure and empty states, plus mobile viewport
```

1. Map landmarks (`header`, `nav`, `main`, `footer`), one `h1` and a logical heading order, lists, tables, and controls.
2. Tab through the whole flow. Order must match visual order; focus must always be visible; `Esc` closes overlays; focus returns to the trigger on close.
3. Every control has an accessible name, role, and state. Errors are text, associated with the field, and announced. Dynamic updates use a live region or move focus deliberately.
4. Check contrast, 200% text zoom and 320 px reflow without two-dimensional scrolling, `prefers-reduced-motion`, and target size.
5. Run an automated scan (axe, Lighthouse), which finds only a fraction of issues, then confirm manually. Use `references/accessibility.md` for the WCAG 2.2 checklist and widget patterns.

## Guardrails

- Use `<button>` for actions and `<a href>` for navigation. Never a clickable `div` or `span`.
- Every input needs a programmatic `<label>`. A placeholder is not a label.
- Never remove outlines without replacing them with a visible focus style (at least 3:1 contrast against adjacent colors). Prefer `:focus-visible`.
- Do not rely on color, hover, sound, or animation alone to convey meaning. Hover-only content must also be reachable by keyboard and dismissible.
- Prefer `<dialog>`, `popover`, `<details>`, and native form controls over custom widgets. A first rule of ARIA applies: no ARIA is better than bad ARIA.
- Provide a `lang` attribute, a descriptive `<title>`, and a skip link when the page has repeated navigation.

## WCAG 2.2 additions to check

- **Focus Not Obscured (2.4.11):** sticky headers and cookie banners must not cover the focused element.
- **Target Size, Minimum (2.5.8):** interactive targets at least 24×24 CSS px, or adequately spaced.
- **Dragging Movements (2.5.7):** every drag interaction has a single-pointer alternative.
- **Consistent Help (3.2.6)** and **Redundant Entry (3.3.7):** do not make users re-enter information already given.
- **Accessible Authentication (3.3.8):** do not require a cognitive test; allow paste and password managers.

## Gotchas

- `aria-label` on a `div` with no role is ignored by many screen readers. Name interactive elements, not generic containers.
- `display: none` and `visibility: hidden` remove content from the accessibility tree; `aria-hidden="true"` on a focusable element creates an invisible tab stop.
- Toasts and inline errors that appear silently are missed by screen readers. Use `role="status"` (polite) or `role="alert"` (urgent) in a container that already exists in the DOM before the update.
- Custom selects, comboboxes, and tabs are easy to get wrong. Follow the [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) patterns exactly or use a native control.
- SPA route changes do not move focus or update the title for assistive tech; manage both.
- Icon-only buttons need a text name (visually hidden text or `aria-label`), and decorative images need `alt=""`.

## Report format

For each issue: location, WCAG criterion, user impact, and the fix. Group by severity, and state what was and was not tested (for example, "keyboard and axe only; no screen reader pass").

Read `references/accessibility.md` for the checklist, widget patterns, and sources.
