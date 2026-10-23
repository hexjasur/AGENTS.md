# Accessibility reference

## Checklist

- **Structure:** landmarks, one `h1`, no skipped heading levels, real lists and tables (`<th scope>`), `lang` on `<html>`, unique `<title>`.
- **Keyboard:** all functionality reachable and operable; logical order; no positive `tabindex`; visible `:focus-visible`; skip link; no keyboard trap; shortcuts can be remapped or disabled.
- **Names and states:** accessible name on every control; `aria-expanded`, `aria-pressed`, `aria-current`, and `aria-invalid` reflect real state; name contains the visible label text (2.5.3).
- **Forms:** programmatic labels, `autocomplete` tokens for personal data (1.3.5), required state, inline text errors tied with `aria-describedby`, error summary that receives focus on submit, no reliance on color alone.
- **Media and images:** meaningful `alt`, `alt=""` for decorative, captions and transcripts, no autoplay with sound, controls for anything moving over 5 s.
- **Visual:** text contrast 4.5:1 (3:1 for large text), UI component and focus contrast 3:1, content reflows at 320 px wide, usable at 200% zoom and with user text-spacing overrides, no content lost in forced-colors mode.
- **Motion:** honor `prefers-reduced-motion`; no flashing over three times per second.
- **Targets:** at least 24×24 CSS px (WCAG 2.2 AA); aim for 44×44 on touch.
- **Status updates:** `role="status"` or `aria-live="polite"` for non-urgent updates, `role="alert"` for urgent errors.

## Widget patterns

| Pattern | Use | Notes |
| --- | --- | --- |
| Modal | `<dialog>` + `showModal()` | Gives focus containment and `Esc`; label with `aria-labelledby`; return focus to the opener |
| Disclosure | `<details>` / `<summary>` | Native keyboard and state |
| Menu button | Button + popover, or `aria-expanded` + list of links/buttons | Avoid `role="menu"` for site navigation; use it only for application menus with full arrow-key support |
| Tabs | APG tabs pattern | `tablist`/`tab`/`tabpanel`, roving `tabindex`, arrow keys |
| Combobox | Native `<select>` or `<datalist>` first | The ARIA combobox pattern is complex; follow APG exactly |
| Toast | Persistent live region | Do not auto-dismiss errors; give enough time to read |
| Data table | Real `<table>` | `<caption>`, header cells, no layout tables |

## Testing order

1. Keyboard-only walkthrough of the primary task.
2. Automated scan (axe DevTools, Lighthouse, `@axe-core/playwright` in CI). Expect to catch only a portion of issues.
3. Inspect the accessibility tree in browser DevTools for names, roles, and states.
4. Zoom to 200% and resize to 320 px; test with `prefers-reduced-motion` and forced colors.
5. Screen reader spot check on the key flow (NVDA or VoiceOver) when the change is interactive.
6. Re-test error, loading, and empty states.

## Sources

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [web.dev Accessibility](https://web.dev/learn/accessibility)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [HTML: a good basis for accessibility](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility/HTML)
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
