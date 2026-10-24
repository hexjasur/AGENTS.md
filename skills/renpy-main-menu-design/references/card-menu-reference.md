# Card-grid main menu reference

Load this after `SKILL.md` when building the menu. Code targets Ren'Py 8.x. Verify each displayable, action, and property against your Ren'Py version, and keep the code in its own file (for example `game/menu_cards.rpy`) after removing or renaming the stock `screen main_menu()`.

## Assets

| Asset | Size (1920 by 1080 game) | Notes |
| --- | --- | --- |
| `gui/menu_hero.webp` | 1920 by 1080 | Key art; keep the focal point in the upper two thirds. Aim for under 400 KB. |
| `gui/tile_play.webp` | about 600 by 220 | Pre-cropped to the tile shape. Aim for under 80 KB each. |
| `gui/tile_continue.webp` | about 480 by 220 | Fallback when there are no saves. |
| `gui/tile_options.webp`, `gui/tile_extras.webp` | about 420 by 100 | Wide and short; keep faces and subjects centered. |
| `gui/logo.webp` | about 700 wide | Transparent background. |
| `gui/menu_scrim.png` | 16 by 512 | Vertical gradient, transparent top to dark bottom. Generated below. |
| `gui/round_mask.png` | 64 by 64 | Optional white rounded square for 9-slice pills and panels. |
| `fonts/icons.ttf` | n/a | Optional icon font for social and quit glyphs. Check its license. |

Generate the scrim once:

```python
# make_scrim.py  (requires Pillow)
from PIL import Image

w, h = 16, 512
img = Image.new("RGBA", (w, h))
for y in range(h):
    t = y / (h - 1)
    alpha = int(255 * (max(0.0, min(1.0, (t - 0.35) / 0.65)) ** 1.6) * 0.95)
    for x in range(w):
        img.putpixel((x, y), (8, 6, 12, alpha))
img.save("menu_scrim.png", optimize=True)
```

## Constants, colors, and styles

```renpy
define menu_pad = 40
define menu_gap = 24
define tile_h = 212
define tile_half = (tile_h - menu_gap) // 2
define demo_build = True

define c_text = "#f5efe8"
define c_accent = "#9a5cff"
define c_panel = "#0b0a10b8"

default persistent.reduce_motion = False
default persistent.sfw_menu = False

# Optional rounded translucent panel from one small 9-slice asset.
define round_panel = Transform(Frame("gui/round_mask.png", 28, 28), matrixcolor=TintMatrix(c_panel))

style menu_pill is frame:
    background round_panel     # use Solid(c_panel) for square pills
    padding (28, 10)

style menu_pill_text is text:
    size 28
    color c_text
    kerning 2

style tile_label is text:
    size 30
    color c_text
    kerning 2
    outlines [(2, "#000000b0", 0, 1)]
    xalign 0.0
```

## Hover transforms

```renpy
transform tile_art_hover:
    subpixel True
    align (0.5, 0.5)
    on idle:
        ease 0.25 zoom 1.0 matrixcolor BrightnessMatrix(-0.12)
    on hover:
        ease 0.25 zoom 1.05 matrixcolor BrightnessMatrix(0.0)

transform tile_art_static:
    align (0.5, 0.5)
    on idle:
        matrixcolor BrightnessMatrix(-0.12)
    on hover:
        matrixcolor BrightnessMatrix(0.0)

transform hero_drift:
    subpixel True
    align (0.5, 0.5)
    zoom 1.0
    linear 40 zoom 1.05
    linear 40 zoom 1.0
    repeat
```

`tile_art_static` changes brightness only, for the reduce-motion setting.

## Reusable tile

```renpy
screen menu_tile(label, art, action, w, h, alt_text=None, enabled=True):
    button:
        xysize (w, h)
        padding (3, 3)                                  # room for the focus ring
        action action
        sensitive enabled
        alt (alt_text or label)
        idle_background Solid("#00000000")
        hover_background Solid(c_accent)                # accent ring on hover and focus
        selected_hover_background Solid(c_accent)

        fixed:
            clipping True                               # keeps the zoom inside the tile
            xysize (w - 6, h - 6)

            add Transform(art, fit="cover", xysize=(w - 6, h - 6)):
                at (tile_art_static if persistent.reduce_motion else tile_art_hover)

            add "gui/menu_scrim.png" xysize (w - 6, h - 6)

            text label style "tile_label":
                xpos 22
                yalign 0.9
                xmaximum (w - 50)
```

If `fit="cover"` does not crop as expected in your version, pre-crop the tile art to the exact aspect ratio; that is the most robust option and the smallest files.

## Main menu screen

```renpy
screen main_menu():
    tag menu
    default newest = renpy.newest_slot()
    $ hero = "gui/menu_hero_sfw.webp" if persistent.sfw_menu else "gui/menu_hero.webp"

    # 1. Hero art, slowly drifting unless reduced motion is on
    if persistent.reduce_motion:
        add Transform(hero, fit="cover", xysize=(config.screen_width, config.screen_height))
    else:
        add Transform(hero, fit="cover", xysize=(config.screen_width, config.screen_height)) at hero_drift

    # 2. Scrim so tiles and labels read clearly
    add "gui/menu_scrim.png" xysize (config.screen_width, config.screen_height)

    # 3. Utility bar
    if demo_build:
        frame:
            style "menu_pill"
            xpos menu_pad
            ypos menu_pad
            text _("DEMO") style "menu_pill_text"

    add "gui/logo.webp" xalign 0.5 ypos menu_pad

    frame:
        style "menu_pill"
        xalign 1.0
        xoffset -menu_pad
        ypos menu_pad
        hbox:
            spacing 22
            # Glyphs depend on your icon font; verify the code points.
            textbutton "" action OpenURL("https://store.steampowered.com/") alt _("Steam page") text_font "fonts/icons.ttf" text_size 30
            textbutton "" action OpenURL("https://discord.com/") alt _("Discord") text_font "fonts/icons.ttf" text_size 30

    # 4. Tile row
    hbox:
        xalign 0.5
        yalign 1.0
        yoffset -menu_pad
        spacing menu_gap

        use menu_tile(_("Play"), "gui/tile_play.webp", Start(), 590, tile_h, alt_text=_("Start a new game"))

        if newest:
            use menu_tile(_("Continue"), FileScreenshot(newest, slot=True), FileLoad(newest, slot=True, confirm=False), 480, tile_h, alt_text=_("Continue from your latest save"))
        else:
            use menu_tile(_("Continue"), "gui/tile_continue.webp", NullAction(), 480, tile_h, enabled=False)

        vbox:
            spacing menu_gap
            use menu_tile(_("Options"), "gui/tile_options.webp", ShowMenu("preferences"), 420, tile_half)
            use menu_tile(_("Extras"), "gui/tile_extras.webp", ShowMenu("extras"), 420, tile_half)

        if renpy.variant("pc"):
            use menu_tile(_("Quit"), "gui/tile_quit.webp", Quit(confirm=False), 84, tile_h, alt_text=_("Quit the game"))
```

Notes:

- `renpy.newest_slot()` is evaluated once when the screen first shows. If it returns `None`, there are no saves.
- `FileScreenshot`, `FileLoad`, and `FileTime` take `slot=True` when you pass a full slot name such as `"1-3"` or `"auto-1"`. Confirm the signatures in your version.
- Create an `extras` screen (gallery, music room, credits) or point the tile at an existing screen. Remove the tile if you have none.
- Replace the placeholder URLs with your real links. `OpenURL` may behave differently on mobile and web builds.
- To show when the latest save was made, add a `text FileTime(newest, format="%d %b, %H:%M", slot=True)` line inside the Continue tile or under it.
- A quit tile with only a glyph needs real `alt` text (provided) and enough contrast.

## Small and touch layout

```renpy
screen main_menu():
    variant "small"
    tag menu

    add Transform("gui/menu_hero.webp", fit="cover", xysize=(config.screen_width, config.screen_height))
    add "gui/menu_scrim.png" xysize (config.screen_width, config.screen_height)
    add "gui/logo.webp" xalign 0.5 ypos 24 zoom 0.7

    grid 2 2:
        xalign 0.5
        yalign 0.95
        spacing 16
        use menu_tile(_("Play"), "gui/tile_play.webp", Start(), 520, 200)
        use menu_tile(_("Continue"), "gui/tile_continue.webp", ShowMenu("load"), 520, 200)
        use menu_tile(_("Options"), "gui/tile_options.webp", ShowMenu("preferences"), 520, 200)
        use menu_tile(_("Extras"), "gui/tile_extras.webp", ShowMenu("extras"), 520, 200)
```

Use larger tiles, fewer items, and no hover-dependent information. Test on a real phone resolution.

## Review checklist

- [ ] Play, Continue, Options, Extras, and (desktop) Quit all work by mouse, touch, keyboard, and gamepad
- [ ] Hover and focus show a clear ring and brightness change; nothing depends on hover alone
- [ ] Label contrast is at least 4.5:1 over every tile and the hero
- [ ] The Continue tile handles no saves, shows the newest save otherwise, and loads it
- [ ] Reduce-motion turns off drift and zoom; a safe-art option exists if mature art is shown
- [ ] Tile art is pre-cropped and compressed; menu loads quickly
- [ ] Long translations fit; labels are real text
- [ ] The small layout works at phone resolution
- [ ] No third-party logos, art, or fonts without a license

## Sources

- [Ren'Py screen language](https://www.renpy.org/doc/html/screens.html)
- [Screen actions and file actions](https://www.renpy.org/doc/html/screen_actions.html)
- [Transform and ATL](https://www.renpy.org/doc/html/atl.html)
- [Matrixcolor and color matrices](https://www.renpy.org/doc/html/matrix.html)
- [GUI customization](https://www.renpy.org/doc/html/gui.html)
