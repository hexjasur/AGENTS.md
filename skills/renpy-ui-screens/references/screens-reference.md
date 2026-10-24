# Ren'Py screens reference

Load this after `SKILL.md` when writing screens, styles, and transforms. Examples target current Ren'Py 8.x.

## GUI variables (`gui.rpy`)

```renpy
define gc_accent_color = "#e0a96d"
define gui.idle_color = "#8f8a85"
define gui.hover_color = "#f2d3a4"
define gc_text_color = "#f4efe8"
define gc_text_font = "fonts/Inter-Regular.ttf"
define gui.interface_text_font = "fonts/Inter-Medium.ttf"
define gc_text_size = 32
define gui.interface_text_size = 30
```

Search the file for the variable before adding a new line; values on `define` lines are the ones to edit.

## Design tokens for a flat, PNG-free look

```renpy
# Do not name these "ui.*" or "theme.*": those are existing Ren'Py modules.
define c_surface = "#15121bd9"        # glass-like panel (translucent, flat)
define c_surface_hover = "#2a2438f2"
define c_border = "#ffffff1f"
define c_text = "#f4efe8"
define c_text_muted = "#b9b2a8"
define c_accent = "#e0a96d"
```

Using named constants keeps colors consistent and easy to retheme. Check contrast: normal text needs 4.5:1 against the panel, large text and UI parts 3:1.

## Choice menu with solid-color buttons

```renpy
screen choice(items):
    style_prefix "choice"

    vbox:
        for i in items:
            textbutton i.caption action i.action

style choice_vbox is vbox:
    xalign 0.5
    ypos 405
    yanchor 0.5
    spacing 14

style choice_button is default:
    properties gui.button_properties("choice_button")
    background Solid(c_surface)
    hover_background Solid(c_surface_hover)
    xminimum 760
    padding (28, 16)

style choice_button_text is default:
    properties gc_text_properties("choice_button")
    color c_text
    hover_color c_accent
    xalign 0.5
```

## Toast notification with ATL

```renpy
transform toast_in:
    on show:
        alpha 0.0 yoffset -16
        easein 0.25 alpha 1.0 yoffset 0
    on hide:
        easeout 0.2 alpha 0.0 yoffset -16

screen toast(message):
    zorder 100
    frame at toast_in:
        background Solid(c_surface)
        padding (28, 14)
        xalign 0.5
        yalign 0.04
        text message color c_text size 28
    timer 2.5 action Hide("toast")

label demo:
    $ renpy.show_screen("toast", _("Game saved"))
    return
```

## Custom HUD (side panel)

```renpy
screen hud():
    zorder 50
    frame:
        background Solid(c_surface)
        xalign 1.0
        yalign 0.0
        xsize 320
        padding (24, 20)
        vbox:
            spacing 10
            text _("Trust: [trust]") color c_text
            text _("Day: [day]") color c_text_muted

label start:
    show screen hud
    # ...
```

`[trust]` and `[day]` are `default` variables. The screen updates after interactions, so keep it light.

## Preferences with accessibility options

```renpy
screen accessibility_preferences():
    tag menu
    use game_menu(_("Accessibility"), scroll="viewport"):
        vbox:
            spacing 24
            label _("Text speed")
            bar value Preference("text speed")
            label _("Auto-forward time")
            bar value Preference("auto-forward time")
            label _("Text size")
            hbox:
                spacing 16
                textbutton _("Normal") action Preference("font size", 1.0)
                textbutton _("Large") action Preference("font size", 1.25)
                textbutton _("Larger") action Preference("font size", 1.5)
            textbutton _("Self-voicing") action Preference("self voicing", "toggle")
            textbutton _("Reduce motion") action ToggleField(persistent, "reduce_motion")
```

Define `default persistent.reduce_motion = False` and check it in transforms or when choosing effects (`if persistent.reduce_motion: ...`). Verify each preference name against your Ren'Py version.

## Variants for small and touch screens

```renpy
screen quick_menu():
    zorder 100
    if renpy.variant("touch"):
        textbutton _("Menu") action ShowMenu("save") xalign 0.98 yalign 0.02 text_size 36
    else:
        hbox:
            xalign 0.5
            yalign 0.99
            spacing 24
            textbutton _("Back") action Rollback()
            textbutton _("Save") action ShowMenu("save")
            textbutton _("Auto") action Preference("auto-forward", "toggle")
```

- Make touch targets large (aim for about 44 px or more) and spaced apart.
- Use `gui.init(1920, 1080)` (through Change/Update GUI) and relative positioning so layouts survive other resolutions.
- Test with the launcher's Android build or device simulation, and with a gamepad if you support one.

## Focus, keyboard, and alt text

```renpy
screen close_button():
    textbutton _("Close") action Hide("my_overlay") alt _("Close the overlay")
    key "K_ESCAPE" action Hide("my_overlay")
```

- Use `key "K_ESCAPE"` and `key "K_RETURN"` for common shortcuts.
- Give `imagebutton`s an `alt` string for self-voicing.
- Keep a visible difference between idle, hover, and selected states.

## Sources

- [Ren'Py screens](https://www.renpy.org/doc/html/screens.html)
- [GUI customization](https://www.renpy.org/doc/html/gui.html)
- [Screen actions](https://www.renpy.org/doc/html/screen_actions.html)
- [Styles](https://www.renpy.org/doc/html/style.html)
- [ATL transforms](https://www.renpy.org/doc/html/atl.html)
- [Self-voicing](https://www.renpy.org/doc/html/self_voicing.html)
