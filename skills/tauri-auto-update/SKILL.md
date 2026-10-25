---
name: tauri-auto-update
description: Implement, review, and debug the hexjasur Tauri v2 auto-update workflow, which uses signed updater artifacts, a GitHub Release latest.json manifest, a tauri-action release pipeline, synchronized versions, and a user-confirmed in-app update flow. Use when adding auto-update to a Tauri app, changing the release workflow, fixing "no update found", signature, or missing-platform errors, or shipping a new version.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# Tauri Auto-Update (hexjasur practice)

The thing that tells an installed desktop app a new version exists is **not the installer**. It is the signed `latest.json` manifest attached to the latest GitHub Release. Build the whole pipeline around producing one correct manifest per release.

## How it works

1. A release is cut by bumping the version, pushing to the release branch, and letting CI build, sign, and publish.
2. CI builds every platform you ship, signs each updater bundle with the Tauri updater key, and uploads installers, `.sig` files, and one `latest.json` to a GitHub Release.
3. The app has a **fixed** endpoint (`.../releases/latest/download/latest.json`). It never changes between releases.
4. On startup the app checks the endpoint, shows a prompt, and only installs after the user confirms. Then it relaunches.

## Procedure

```text
- [ ] 1. Generate the updater signing keypair; back up the private key
- [ ] 2. Configure tauri.conf.json, Rust plugin, JS packages, capabilities
- [ ] 3. Add the version-sync check (package.json, tauri.conf.json, Cargo.toml, CHANGELOG)
- [ ] 4. Build the release pipeline: check, draft release, build matrix, verify, publish
- [ ] 5. Add the in-app update flow with user confirmation
- [ ] 6. Test an old build updating to a new release before announcing it
```

1. Run `tauri signer generate` and keep the private key and its password in repository secrets **and** in a password manager. Put the **public key content** (not a path) in config. Losing the private key means existing installs can never be updated.
2. Enable `bundle.createUpdaterArtifacts`, set `plugins.updater.pubkey` and `endpoints`, register the updater and process plugins for desktop only, and grant `updater:default` plus the process restart permission. Snippets are in `references/update-ui.md`.
3. Keep one version in `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`, add a matching `CHANGELOG.md` entry, and fail CI if they disagree or the `vX.Y.Z` tag already exists. Script and workflow are in `references/release-workflow.md`.
4. Pipeline order: **check-version → create draft release → build matrix (upload to the draft) → verify `latest.json` → publish the draft.** Users must never see a half-built release as "latest".
5. Check after a short delay (about 2.5 s), at most once per hour automatically, show version and notes, install only on user click, show progress, then relaunch. See `references/update-ui.md`.
6. Install the previous version, publish the new release, confirm the prompt, update, and confirm the new version runs. Also test an offline start and a corrupted download.

## Guardrails

- Never commit, print, or paste the private signing key or its password. Read them from CI secrets only; `.env` files are not read by the updater signer.
- Never disable signature verification, and never use `dangerousInsecureTransportProtocol` in production. Endpoints must be HTTPS.
- Never install an update silently without user consent.
- Never reuse or overwrite a published version. If a release is bad, publish a **higher** patch version with the fix.
- Never put a different endpoint per release; keep the `latest/download/latest.json` URL stable.
- Never rotate the updater key without a migration plan, because old installs only trust the old public key.
- Do not ship an app whose `latest.json` was not inspected after CI produced it.

## Gotchas

- `latest.json` must list **every platform you ship**. Tauri validates the entire file, and a missing `linux-x86_64` leaves Linux users without updates.
- `signature` in the manifest is the **content** of the `.sig` file, not its path or URL.
- Linux updates work with **AppImage**. A `.deb` or `.rpm` install cannot self-update.
- `/releases/latest/` skips **drafts and prereleases**. That is why the draft is published only after verification, and why a prerelease will not reach users.
- Create the draft release once, then pass its `releaseId` **and** `tagName` to `tauri-action` so parallel matrix jobs do not create duplicate drafts and the manifest URLs point at the tag.
- Updater signing is separate from OS code signing. Updater signatures verify updates; Windows signing and macOS notarization address SmartScreen and Gatekeeper.
- On Windows the app exits while the installer runs. `installMode: "passive"` (default) shows progress without prompts.
- The updater plugin is desktop-only. Handle Android, iOS, and web with a separate path (store, APK link, or nothing) behind one `updater` abstraction chosen by platform.
- Pin every GitHub Action to a full commit SHA. Check the current `tauri-action` major version; the official docs currently use `@v1`.
- `pub_date` must be RFC 3339 and `version` valid SemVer.
- A tag that already exists stops the release by default. Offer a `force` input only for deliberate rebuilds.

## Report format

For a review: list what is correct, then issues ordered by risk (users cannot update, security, release safety, UX), each with the file, the problem, and the fix. State what was tested end to end and what was not.

Read `references/release-workflow.md` for the version check script, the release workflow template, the manifest verification step, and an optional custom manifest generator. Read `references/update-ui.md` for configuration snippets and the React update flow.
