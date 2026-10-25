---
name: renpy-ui-screens
description: Design and implement Ren'Py GUI and screens with the GUI workflow, gui.rpy variables, screen language, styles, ATL transforms, PNG-free solid-color and glass-style interfaces, accessible text and navigation, and mobile and gamepad support. Use when customizing the main menu, say window, choice menu, preferences, save/load, notifications, HUDs, inventories, or any custom screen in a Ren'Py visual novel or game.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# Ren'Py UI and Screens

Start from the generated GUI, change variables before screens, and write screens that are cheap to evaluate, keyboard- and touch-friendly, and readable.

## Procedure

```text
- [ ] 1. Pick resolution and color scheme with the launcher's Change/Update GUI first
- [ ] 2. Tune gui.rpy variables (colors, fonts, sizes) before touching screens.rpy
- [ ] 3. Build or override screens with styles, not repeated inline properties
- [ ] 4. Add motion with short ATL transforms
- [ ] 5. Check accessibility, keyboard and gamepad focus, and touch
- [ ] 6. Test every screen at the target resolution and on small and touch variants
```

1. Regenerating the GUI overwrites most image files and your `gui.rpy` edits, so choose size and colors first and back up custom art before regenerating.
2. Change values on `define` lines in `gui.rpy` (`gui.accent_color`, `gui.text_font`, `gui.text_size`, `gui.interface_text_size`). Colors are `"#rrggbb"` or `"#rrggbbaa"`. Font files must live in the game directory.
3. Override stock screens (`say`, `choice`, `navigation`, `preferences`) minimally. Define reusable styles with `style name is parent:` and apply them with `style_prefix`.
4. Use ATL transforms (`on show`, `on hide`, `easein`, `easeout`) for fades and slides. Keep them between 0.15 s and 0.4 s.
5. Every interactive element must be reachable by keyboard or gamepad focus, have a text label or `alt`, and not depend on hover. Provide text size, text speed, and reduced-motion options.
6. Use `variant` screens or `renpy.variant("small")` / `renpy.variant("touch")` for phones and tablets. Test at the real resolution.

Snippets for a PNG-free glass-style UI, a toast notification, choices, preferences, and variants are in `references/screens-reference.md`.

## Guardrails

- Never hand-edit images that Change/Update GUI will regenerate unless you keep a backup.
- Never rely on hover for essential information; touch devices have no hover.
- Never put slow or side-effecting Python in a screen. Screens re-evaluate often; compute in labels or functions and pass values in.
- Never convey meaning with color alone, and never go below comfortable text sizes on small screens.
- Never remove focus feedback from buttons; keep a visible idle/hover/selected difference.
- Do not hard-code pixel positions for one resolution when `xalign`, `yalign`, `xfill`, and `xsize` relative to `config.screen_width` can adapt.
- Do not use flashing effects without a setting to turn them off.

## Gotchas

- Edit `gui.rpy` and `options.rpy` first. Heavy `screens.rpy` edits make future Ren'Py updates harder; add style overrides at the end instead of rewriting stock screens.
- Screen variables declared with `default` inside a screen are local to that screen. Use `SetVariable`, `ToggleVariable`, and `SetScreenVariable` actions instead of `$` inside screens.
- Screens run their Python on every update, so `$` there must be cheap and side-effect free.
- Use `tag` for screens that replace each other (menus) and `modal True` for overlays that should block clicks.
- `zorder` controls stacking; `modal` and `zorder` together decide what receives clicks.
- Use `style_prefix "name"` so `name_button` and `name_button_text` styles apply automatically.
- `imagebutton` needs `alt` text for self-voicing. Prefer `textbutton` where an image is not needed.
- Fonts need glyph coverage for every language you ship; set per-language fonts in translation blocks.
- `Solid("#rrggbbaa")` gives flat colored panels without PNG assets. Rounded corners and soft shadows need image assets or a shader, so choose a flat style when you want zero image files.
- Icon fonts (a `.ttf` with glyphs) replace icon PNGs while staying sharp at any size; set `gui.glyph_font` or `text_font` on the element.
- Test with `Shift+A` (accessibility menu) and `Shift+V` (self-voicing) to catch missing labels and text-size problems.

## Report format

For a review: list issues by severity (unusable, inaccessible, broken on touch or small screens, performance, polish), each with file and line, the cause, and the fix. State resolutions and variants tested.

Read `references/screens-reference.md` for screen, style, and ATL examples. For a cinematic card-grid main menu, use `renpy-main-menu-design`.
