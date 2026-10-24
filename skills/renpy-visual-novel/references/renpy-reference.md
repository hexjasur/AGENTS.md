# Ren'Py reference

Load this after `SKILL.md` for layout, snippets, translation, and build details. Examples target current Ren'Py 8.x (Python 3).

## Project layout

```text
my-game/
├── game/
│   ├── options.rpy        # name, version, save directory, build settings
│   ├── gui.rpy            # GUI variables (see renpy-ui-screens)
│   ├── screens.rpy        # screens (see renpy-ui-screens)
│   ├── script.rpy         # label start, chapter hand-offs
│   ├── script/
│   │   ├── ch01.rpy
│   │   └── ch02.rpy
│   ├── characters.rpy     # define Character(...) and shared constants
│   ├── images/            # lowercase names: eileen happy.png
│   ├── audio/
│   ├── gui/
│   └── tl/<language>/     # generated translations
└── README.md
```

## `.gitignore` for Ren'Py projects

```gitignore
*.rpyc
*.rpymc
*.bak
game/cache/
game/saves/
saves/
cache/
log.txt
errors.txt
traceback.txt
/dists/
/old-game/*.rpyb
```

Do not ignore the whole `old-game/` folder if you rely on its `.rpyc` files to keep save identifiers stable; archive it with each release instead.

## define vs default vs `$`

```renpy
# Constants: evaluated once at init, never changed during play.
define e = Character("Eileen", color="#c8ffc8")
define slow_fade = Fade(1.0, 0.5, 1.0)
define MAX_TRUST = 10

# Anything that changes during play: saved, loaded, and rolled back.
default trust = 0
default met_eileen = False
default inventory = []

label start:
    $ trust += 1
    $ inventory.append("key")
    e "We meet again."
    return
```

Do not change a `define`d value (`$ MAX_TRUST = 20` is undefined behavior). Do not rely on `init python` variables for story state.

## Menus and flags

```renpy
label ch01_cafe:
    scene bg cafe with dissolve
    show eileen happy at center
    e "Coffee?"

    menu:
        "Accept":
            $ trust += 1
            $ accepted_coffee = True
            e "Great!"
        "Decline":
            $ trust -= 1
            e "Maybe next time."

    jump ch01_walk
```

Declare `default accepted_coffee = False` once at top level. Keep flag names descriptive and scoped (`ch01_accepted_coffee`) so late chapters stay readable.

## Persistent data

```renpy
init python:
    if persistent.endings_seen is None:
        persistent.endings_seen = set()

label ending_good:
    $ persistent.endings_seen.add("good")
    return
```

Persistent data survives across saves and playthroughs and is not rolled back. Use it for unlocks, never for story state.

## Save migration

```renpy
define config.version = "1.3.0"
default save_schema = 2

label after_load:
    if save_schema < 2:
        $ trust = max(0, trust)   # example fix for an older save
        $ save_schema = 2
    return
```

`after_load` runs after a save loads. Keep every migration step idempotent and test with real saves from the previous release.

## Translation workflow

1. Wrap UI text in `_("Start")` and keep dialogue in normal say statements.
2. In the launcher choose Generate Translations and name the language. Files appear in `game/tl/<language>/`.
3. Fill each `translate <language> <id>:` block and `translate <language> strings:` entries.
4. Set per-language fonts with `translate <language> style` or `translate python` blocks (`gui.text_font`, `gui.system_font`).
5. Add a language selector to the preferences screen: `textbutton "Español" action Language("spanish")`.
6. Do not put visible side effects in translate-block Python; switching language reruns it.

## Build settings

```renpy
init python:
    build.name = "mygame"
    build.version = "1.3.0"
    build.itch_project = "yourname/mygame"      # optional: enables itch.io upload
    build.classify("**~", None)
    build.classify("**.bak", None)
    build.classify("**/.**", None)
```

- Build from the launcher with Build Distributions, then test each package (Windows, Linux, Mac, Android, Web) on its real platform.
- Android builds are signed with a keystore. Back the keystore up safely; without it you cannot publish updates to existing installs.
- Android and Web builds have their own launcher steps and limits (memory, file size, supported media). Check the current Ren'Py docs before targeting them.

## Release checklist

- [ ] Lint is clean; every branch and ending was played
- [ ] `config.version` and `build.version` bumped; changelog written
- [ ] Old saves from the previous release load and continue
- [ ] Rollback, skip, auto-forward, and quick save/load behave
- [ ] Fonts, credits, and licenses verified; third-party assets listed
- [ ] Packages tested on each target platform; permissions intact (not rezipped)
- [ ] Store page, age rating, and content warnings match the build

## Sources

- [Ren'Py documentation](https://www.renpy.org/doc/html/)
- [Python statements: define, default, init python](https://www.renpy.org/doc/html/python.html)
- [Building distributions](https://www.renpy.org/doc/html/build.html)
- [Translation](https://www.renpy.org/doc/html/translation.html)
- [GUI customization](https://www.renpy.org/doc/html/gui.html)
