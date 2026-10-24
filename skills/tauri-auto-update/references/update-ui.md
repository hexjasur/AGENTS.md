# Updater configuration and in-app flow

Load this when wiring the updater into a Tauri v2 app. Replace `OWNER/REPO`.

## Setup commands

```sh
# Generate the keypair once; keep the private key and password backed up.
npm run tauri signer generate -- -w ~/.tauri/myapp.key

npm run tauri add updater
npm run tauri add process
```

Use your package manager's equivalent of `npm run`. Rust 1.90 or later is required by the current updater plugin.

## `src-tauri/tauri.conf.json`

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "<PUBLIC KEY CONTENT, not a file path>",
      "endpoints": [
        "https://github.com/OWNER/REPO/releases/latest/download/latest.json"
      ],
      "windows": {
        "installMode": "passive"
      }
    }
  }
}
```

`createUpdaterArtifacts` is the v2 setting; use `"v1Compatible"` only when migrating an app that already has v1 installs.

## Rust: desktop-only registration

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            #[cfg(desktop)]
            app.handle().plugin(tauri_plugin_updater::Builder::new().build())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Capability

`src-tauri/capabilities/default.json` (keep other permissions your app needs):

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": ["core:default", "updater:default", "process:allow-restart"]
}
```

## React update flow

Behavior: first check about 2.5 s after launch, automatic checks at most once per hour, install only after the user confirms, show progress, relaunch when done.

```tsx
// updater.ts
import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const COOLDOWN_MS = 60 * 60 * 1000;
const STORAGE_KEY = 'updater:lastCheck';

export const isDesktopTauri = () => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

function recentlyChecked(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(STORAGE_KEY) ?? 0) < COOLDOWN_MS;
  } catch {
    return false;
  }
}

export async function checkForUpdate(manual = false): Promise<Update | null> {
  if (!isDesktopTauri()) return null;
  if (!manual && recentlyChecked()) return null;
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // Storage can be unavailable; the check still works without the cooldown.
  }
  return check();
}

export async function installUpdate(
  update: Update,
  onProgress: (downloaded: number, total: number | undefined) => void,
): Promise<void> {
  let downloaded = 0;
  let total: number | undefined;
  await update.downloadAndInstall((event) => {
    if (event.event === 'Started') total = event.data.contentLength;
    if (event.event === 'Progress') {
      downloaded += event.data.chunkLength;
      onProgress(downloaded, total);
    }
  });
  await relaunch();
}
```

```tsx
// UpdateGate.tsx
import { useEffect, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { checkForUpdate, installUpdate } from './updater';

export function UpdateGate() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkForUpdate().then(setUpdate).catch((e) => console.warn('Update check failed', e));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!update) return null;

  const onUpdate = async () => {
    setError(null);
    try {
      await installUpdate(update, (done, total) => setProgress(total ? Math.round((done / total) * 100) : 0));
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div role="dialog" aria-labelledby="update-title">
      <h2 id="update-title">Version {update.version} is available</h2>
      {update.body && <p>{update.body}</p>}
      {progress !== null && <progress value={progress} max={100} />}
      {error && <p role="alert">{error}</p>}
      <button onClick={onUpdate} disabled={progress !== null}>Update and restart</button>
      <button onClick={() => setUpdate(null)} disabled={progress !== null}>Later</button>
    </div>
  );
}
```

Notes:

- Use a native `<dialog>` or your design system's modal in a real app; keep focus handling and Escape support.
- A failed check must never block the app. Log it and move on.
- If the app also runs on the web or Android, keep the GitHub Releases API path in a separate function and select it by platform. The updater plugin only covers desktop.
- For a manual "Check for updates" button, call `checkForUpdate(true)` and show "You are up to date" when it returns `null`.

## Sources

- [Tauri updater plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri capabilities](https://v2.tauri.app/security/capabilities/)
