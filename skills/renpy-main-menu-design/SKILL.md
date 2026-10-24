---
name: renpy-main-menu-design
description: Design and build a modern card-grid main menu for Ren'Py games that does not look like stock Ren'Py, with full-bleed hero art, a dark scrim, a centered logo, pill-shaped info and social bars, large art tiles for Play, Continue, Options, and Extras, a Continue card that shows the latest save, hover motion, and touch and controller support. Use when someone wants a more unique, premium, cinematic, or modern Ren'Py main menu, asks for main menu design ideas, or wants to replace the plain text-list menu with a grid, cards, or tiles.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Ren'Py Main Menu Design (card grid)

The stock Ren'Py menu is a text list over a background. A card-grid menu turns the menu into a poster: the key art fills the screen, and a few large art tiles act as the buttons. It is mostly layout, a scrim, and careful hover states, so it works in plain Ren'Py with no plugins.

## The pattern

```text
┌────────────────────────────────────────────────────────────┐
│ [ DEMO ]              [ L O G O ]            [ ◉  ◉  ◉ ]    │  utility bar: build tag, logo, links
│                                                            │
│              full-bleed hero art (dimmed)                   │
│                                                            │
│ ░░░░░░░░░░░░░░░░░ dark scrim fades up ░░░░░░░░░░░░░░░░░░░░ │
│ ┌──────────────┐ ┌───────────┐ ┌───────────┐ ┌──┐          │
│ │ PLAY         │ │ CONTINUE  │ │ OPTIONS   │ │↦ │          │  one row of tiles:
│ │  (largest)   │ │ last save │ ├───────────┤ │  │          │  size = importance
│ └──────────────┘ └───────────┘ │ EXTRAS    │ └──┘          │
│                                └───────────┘               │
└────────────────────────────────────────────────────────────┘
```

Why it feels premium: clear hierarchy (Play is biggest), art as navigation (each tile previews content), one gutter and radius everywhere, a dimmed hero so the UI pops, small spaced capital labels, and feedback on hover and focus.

## Procedure

```text
- [ ] 1. Pick the layout concept and set grid constants
- [ ] 2. Prepare assets: hero, pre-cropped tiles, logo, one scrim gradient
- [ ] 3. Replace screen main_menu with layers: hero, scrim, utility bar, tile row
- [ ] 4. Build one reusable tile screen with hover, focus, alt text, disabled state
- [ ] 5. Wire real actions: Start, Continue from the newest save, Preferences, Extras, Quit
- [ ] 6. Add restrained motion and a reduced-motion option
- [ ] 7. Add the small and touch layout; test keyboard, gamepad, long translations
```

1. Choose the concept (see Ideas) and define constants for padding, gap, and tile height so every tile aligns to the same grid.
2. Use one 16:9 hero image, small **pre-cropped** WebP tiles, a transparent logo, and a single tiny scrim gradient. Do not scale full-size art for tiles at runtime.
3. Edit the stock `screen main_menu()` in `screens.rpy` (or replace it deliberately). Stack layers back to front: hero, scrim, utility bar, tiles. Code is in `references/card-menu-reference.md`.
4. Build `menu_tile` once (art, label, action, size) and reuse it. Show a visible hover and focus ring, give it `alt` text, and support a disabled state.
5. Keep every stock function reachable: Start, Load, Preferences, About or Help, and Quit on desktop. Continue loads the newest save and shows its screenshot and time.
6. Use a slow zoom or brightness change on hover. Offer a reduce-motion preference and honor it.
7. Provide a `small` variant (2 by 2 grid, larger targets) and test with a gamepad, keyboard only, and your longest translation.

## Layout ideas to offer

- **Bottom card row (the pattern above):** cinematic and compact; best for story and character art.
- **Left rail with large type:** a vertical list of big labels over art with a hover preview that swaps the hero; best for moody, text-led games.
- **Centered 2 by 2 grid:** symmetrical and mobile-friendly; best for games with few menu items.
- **Bottom dock:** a thin row of icon plus label chips under the logo; best for minimal, clean styles.
- **Split screen:** character cutout on one side, menu column on the other; best for character-driven games.

Pick one, then make spacing, radius, type, and motion consistent across menu, preferences, and save screens.

## Guardrails

- Never remove access to Load, Preferences, or Quit (desktop). Players must reach them with mouse, touch, keyboard, and gamepad.
- Never bake text into art. Labels must be real text so translation, scaling, and screen readers work.
- Never rely on hover alone; touch devices have none. Every tile is a normal button with an action.
- Never ship unreadable labels. Put a scrim under label text and meet 4.5:1 contrast.
- Never copy another game's layout pixel for pixel, logo, art, or typography. Take the idea, not the assets; use art you have the rights to.
- Never scale huge images per tile at runtime. Pre-crop and compress tile art.
- Do not hide a mature-content warning, age gate, or store-required notice behind the stylish menu.

## Gotchas

- Keep one scrim asset (a 16 by 512 gradient) and reuse it for the hero and tile labels. A flat `Solid` overlay looks muddy; the gradient creates depth.
- Rounded corners need a small asset or a mask; a plain `Solid` is always square. Use a 9-slice rounded rectangle tinted with `matrixcolor`, or accept square tiles for a flat look.
- Scale the art inside a clipped box (`clipping True`) so the hover zoom does not spill over neighbors.
- Compute the newest save once with a screen-level `default`, not on every update.
- The Continue tile needs an empty state (no saves): show static art and disable it.
- `renpy.variant("pc")` gates Quit; stock Ren'Py hides Quit on mobile.
- Long translated labels overflow tiles. Use `size`, `xmaximum`, and `text_align`, and test with a long language.
- Menu art that shows mature content: consider a persistent "safe menu art" switch for streaming and public places.
- Regenerating the GUI from the launcher can overwrite `screens.rpy` customizations; keep the menu in its own file where possible and back it up first.
- Animations should be subtle: 0.2 to 0.3 s ease, zoom no more than about 5 percent.

## Review format

List issues by impact (cannot navigate, unreadable, inaccessible, performance, polish), each with the screen and line, the problem, and a concrete fix. State resolutions, input methods, and languages tested.

Read `references/card-menu-reference.md` for the full screen code, styles, transforms, the small layout, the asset spec, the scrim generator, and a checklist. For general screen and GUI practice, use `renpy-ui-screens`.
