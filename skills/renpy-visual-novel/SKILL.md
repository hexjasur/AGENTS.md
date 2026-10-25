---
name: renpy-visual-novel
description: Plan, write, structure, test, translate, and ship Ren'Py visual novels and adult or episodic VNs (AVNs) with clean script organization, correct define/default/persistent usage, save compatibility across updates, lint-clean scripts, translations, and PC, Android, web, and itch.io builds. Use when starting or reviewing a Ren'Py project, writing labels, menus and flags, fixing save or rollback bugs, running Lint, adding translations, or preparing a release or update.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# Ren'Py Visual Novel Development

Ren'Py scripts are easy to start and easy to break after release. Keep state in the right place, keep saves compatible, and run Lint before every build.

## Procedure

```text
- [ ] 1. Set up structure, .gitignore, and options.rpy (name, version, save directory)
- [ ] 2. Declare characters and constants with define; all changing state with default
- [ ] 3. Write scenes as labels; route with jump, call, and return deliberately
- [ ] 4. Run Lint, play every branch, and test rollback and load
- [ ] 5. Add translation hooks and accessibility basics early
- [ ] 6. Build, test the package on each target platform, then release
- [ ] 7. For updates, keep saves loadable (see Updating a released game)
```

1. Put chapters in separate `.rpy` files under `game/` (for example `game/script/ch01.rpy`), keep the entry in `label start:`, and set `config.name`, `config.version`, and `config.save_directory` in `options.rpy` before the first public build. Use `references/renpy-reference.md` for the layout, `.gitignore`, and snippets.
2. `define` is for values that never change (characters, transitions, constants). `default` is for **every** variable that changes during play, so it is saved, loaded, and rolled back. Change state with `$` or `python:` inside labels.
3. One label per scene or beat, descriptive names (`ch01_cafe_meeting`), and an explicit end (`return` from a called label, `jump` to the next, or `return` from `start` to end the game). Use `menu:` for choices and store the result in a flag with a clear name.
4. Run Lint (launcher: Check Script) after every change batch. It finds missing labels and images, duplicate definitions, and undefined variables. During play use `Shift+R` to reload and `Shift+D` for the developer menu; roll back and reload to confirm state is correct.
5. Wrap player-visible UI strings in `_()` and keep story text in say statements so Ren'Py can generate translations. Offer text-size and text-speed preferences early.
6. Set `build.name` and `build.version`, classify files, build distributions from the launcher, and test the packaged build, not only the editor run.
7. Never rename or delete a `default` variable or label that older saves may use without a migration.

## Guardrails

- Never change a `define`d value during play. Anything that changes belongs in `default`.
- Never change `config.save_directory` after release; players lose access to existing saves.
- Never delete or rename variables, labels, or screens used by released saves without an `after_load` migration. Add new variables with `default` instead.
- Never edit `.rpyc` or `.rpymc` files and never commit them, saves, caches, `log.txt`, or `traceback.txt`.
- Never use tabs in `.rpy` files. Use four spaces.
- Never use art, music, fonts, or code you do not have a license for, and keep a credits list.
- Never ship with `config.developer` forced on; leave it at the default so distributions disable it.
- Do not translate or redistribute someone else's game without the creator's permission.
- Follow the age-rating and content rules of each store (itch.io, Steam, Patreon, and others) for mature content.

## Gotchas

- Variables set in `init python` or with `define` are **not** saved or rolled back, and can leak into a new game started from the main menu. Use `default`.
- A `call` without a matching `return`, or reaching the end of `start`, ends the game or returns to the menu unexpectedly.
- In text, `[name]` interpolates a variable. Write `[[` for a literal bracket, `{{` for a literal brace, and `%%` where percent formatting applies.
- File names are case-sensitive on Linux and Android. `Images/Eileen.PNG` works on Windows and fails elsewhere. Use lowercase names.
- Image names come from file names (`eileen happy.png` becomes `show eileen happy`). Keep the naming scheme consistent and avoid spaces in directories.
- Python code with side effects (writing files, network calls) is not rollback-safe. Keep story state in Ren'Py variables.
- `python:` blocks and `$` run when reached; `init python` blocks run once at startup in priority order.
- Rezipping a Ren'Py Linux or Mac build on Windows drops the permissions the game needs. Distribute the archives Ren'Py produced.
- Keep a copy of the last release's `.rpyc` files in `old-game` so internal save identifiers stay consistent between versions.
- Archiving assets into `.rpa` files hides nothing from determined users and can make updates larger; archive only when it helps.

## Updating a released game (episodic and AVN releases)

- Bump `config.version` and `build.version` for every release.
- Add new variables with `default`; Ren'Py fills them in when an old save loads.
- If a variable or flow changes meaning, add an `after_load` label or `config.after_load_callbacks` function that converts old state, and test with saves from the previous release.
- Keep labels from previous releases, or add redirects, so old saves can still resume.
- Use `persistent` data only for cross-playthrough facts (unlocked gallery, seen endings), never for story state.

## Report format

For a review: list issues by risk (breaks saves, crashes, lint errors, license or store-policy issues, polish), each with file and line, why it matters, and the fix. State which platforms, branches, and saves were actually tested.

Read `references/renpy-reference.md` for the project layout, `.gitignore`, define/default examples, menus and flags, save migration, translation, and build and itch.io snippets.
