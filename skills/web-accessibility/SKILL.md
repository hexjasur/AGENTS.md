---
name: web-accessibility
description: Build and review accessible web pages, components, forms, and interactions with semantic HTML, keyboard support, focus management, contrast, and screen-reader-friendly states. Use for UI work, dialogs, navigation, forms, or accessibility audits.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Web Accessibility

Start with platform semantics. Add ARIA only when native HTML cannot express the behavior, and make every interaction usable without a pointer.

## Review workflow

1. Identify the user task and semantic structure: landmarks, headings, labels, lists, tables, buttons, links, and controls.
2. Check keyboard order, visible focus, Escape behavior, focus trapping/return for dialogs, and no keyboard-only dead ends.
3. Check names, roles, values, error messages, live updates, alt text, link purpose, contrast, text resizing, reduced motion, and touch targets.
4. Test with browser accessibility tooling and keyboard-only navigation. Use a screen reader or automated checks as a supplement, not a substitute.
5. Verify responsive layouts and failure states, not only the happy-path desktop view.

## Guardrails

- Use a real `<button>` for actions and `<a>` for navigation. Do not make clickable `div` elements.
- Every input needs an associated label and useful error recovery.
- Never remove outlines without replacing them with a stronger visible focus style.
- Do not rely on color, hover, sound, or animation alone to convey meaning.
- Read `references/accessibility.md` for the detailed checklist and source links.
