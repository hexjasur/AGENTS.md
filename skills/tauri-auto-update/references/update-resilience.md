# Update resilience: refresh, close, and UI bugs during an update

Load this when the update screen misbehaves: reload (F5, Ctrl+R) mid-download, closing the window while installing, double prompts, a progress bar stuck at 0%, or a dialog that scrolls wrong. The goal is simple: **once an install starts, nothing the user does by accident should corrupt it or leave the UI in a lie.**

## What breaks and why

| Symptom | Cause | Fix |
| --- | --- | --- |
| After refresh the prompt appears again, or two downloads run | JS state (`useState`, the `Update` handle, the progress callback) is lost on reload; the app re-checks and starts over | Persist an `installing` flag, guard re-entry, block reload while installing |
| Window closed mid-install, app stuck on the old version or half-installed | Nothing stops `CloseRequested` | Prevent close while installing (JS and Rust) |
| Progress bar stuck at 0% | `contentLength` is `undefined` for some servers/redirects and the code divides by it | Indeterminate `<progress>` when total is unknown |
| Double click starts two installs | Button disabled only after the next render | Synchronous lock (`useRef`), not just state |
| Background page scrolls behind the dialog; long notes push buttons off screen | No scroll containment, dialog taller than the window | Native `<dialog>`, capped height, only the notes area scrolls |
| Escape closes the dialog during download | Native `cancel` event | `preventDefault()` on `cancel` while installing |
| Prompt re-appears every launch after "Later" | Dismissal not remembered | Store the dismissed version |
| Update check fires twice in dev | React StrictMode and HMR remount effects | Skip in dev; clean up timers |

Treat everything after a reload as **unknown state**: JS callbacks and handles are gone, so do not assume the earlier download finished or failed.

## 1. Install state that survives a reload

Use `sessionStorage` (survives reload, cleared when the window closes). Always wrap it in try/catch.

```ts
// update-state.ts
const KEY = 'updater:installing';
const STARTED_MAX_AGE_MS = 15 * 60 * 1000;

export const installLock = {
  begin(version: string) {
    try { sessionStorage.setItem(KEY, JSON.stringify({ version, at: Date.now() })); } catch { /* ignore */ }
  },
  end() {
    try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  },
  /** Returns the version being installed, or null. Stale locks expire so a crash cannot trap the UI. */
  current(): string | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const { version, at } = JSON.parse(raw) as { version: string; at: number };
      return Date.now() - at < STARTED_MAX_AGE_MS ? version : null;
    } catch {
      return null;
    }
  },
};
```

On mount, if `installLock.current()` is set, **do not auto-check**. Show a neutral "Finishing the update…" state with an indeterminate bar and a "Check again" action that clears the lock. That is honest: after a reload the app cannot know the real progress.

If you need exact progress after reload, move the install into a Rust command that owns the state (`Mutex<UpdateState>` in `app.manage`), emits events, and exposes a `get_update_state` command the UI calls on mount. Prefer this for large apps; the `sessionStorage` approach is the smallest fix.

## 2. Block accidental reload while installing

Add the listener only while an install runs, and remove it after. This is a UX guard against accidents, not a security control.

```ts
export function blockReloadWhileInstalling(): () => void {
  const onKey = (e: KeyboardEvent) => {
    const reload = e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'r');
    if (reload) e.preventDefault();
  };
  window.addEventListener('keydown', onKey, { capture: true });
  return () => window.removeEventListener('keydown', onKey, { capture: true });
}
```

Also disable the DevTools reload path in release builds by not enabling `devtools` in production (see `tauri-best-practices`).

## 3. Block closing the window while installing

JavaScript side:

```ts
import { getCurrentWindow } from '@tauri-apps/api/window';

const unlisten = await getCurrentWindow().onCloseRequested((event) => {
  event.preventDefault(); // optionally show "Update in progress" instead of closing
});
// call unlisten() when the install ends or fails
```

Rust side, when the install runs in Rust or you want a guard that survives a reload:

```rust
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{Manager, WindowEvent};

pub struct Installing(pub AtomicBool);

// in .setup() or Builder::on_window_event
.on_window_event(|window, event| {
    if let WindowEvent::CloseRequested { api, .. } = event {
        let state = window.state::<Installing>();
        if state.0.load(Ordering::SeqCst) {
            api.prevent_close();
        }
    }
})
```

Always clear the flag on failure so the user can quit. Never trap the user in an app that cannot close.

## 4. Single-flight install and honest progress

```ts
// updater.ts additions
let inFlight: Promise<void> | null = null;

export function installOnce(update: Update, onProgress: (done: number, total?: number) => void) {
  if (inFlight) return inFlight; // second click or remount returns the same promise
  installLock.begin(update.version);
  const unblock = blockReloadWhileInstalling();
  inFlight = installUpdate(update, onProgress)
    .catch((e) => { installLock.end(); throw e; })
    .finally(() => { unblock(); inFlight = null; });
  return inFlight;
}
```

Progress state must distinguish three cases: not started, running with a known total, running with an unknown total.

```tsx
type Progress = { phase: 'idle' } | { phase: 'running'; done: number; total?: number } | { phase: 'installing' };

// Render
<progress
  max={progress.phase === 'running' ? progress.total : undefined}
  value={progress.phase === 'running' && progress.total ? progress.done : undefined}
  aria-label="Downloading update"
/>
```

A `<progress>` with no `value` is indeterminate, which is correct when `contentLength` is unknown. When the download finishes, switch to "Installing…" (the app may exit on Windows, so do not promise anything after it). Update state at most every ~100 ms to avoid re-render storms on fast links.

## 5. Dialog that scrolls correctly

Use a native `<dialog>` opened with `showModal()`: it makes the rest of the page inert, traps focus, and handles stacking. Only the release notes scroll.

```tsx
const ref = useRef<HTMLDialogElement>(null);
useEffect(() => { ref.current?.showModal(); return () => ref.current?.close(); }, []);

<dialog
  ref={ref}
  className="update-dialog"
  aria-labelledby="update-title"
  onCancel={(e) => { if (installing) e.preventDefault(); }} // Escape
>
  <header><h2 id="update-title">Version {update.version} is available</h2></header>
  <div className="update-notes" tabIndex={0}>{/* render notes as text */}</div>
  <footer>{/* progress, error, buttons */}</footer>
</dialog>
```

```css
.update-dialog {
  display: flex;
  flex-direction: column;
  width: min(32rem, calc(100vw - 2rem));
  max-height: min(80dvh, 40rem);
  padding: 0;
  overflow: hidden;               /* the dialog itself never scrolls */
}
.update-dialog:not([open]) { display: none; }
.update-dialog > header,
.update-dialog > footer { flex: none; padding: 1rem 1.25rem; }
.update-notes {
  flex: 1 1 auto;
  min-height: 0;                  /* required so the flex child can shrink and scroll */
  overflow-y: auto;
  overscroll-behavior: contain;   /* wheel at the end does not scroll the page behind */
  scrollbar-gutter: stable;       /* no layout shift when the scrollbar appears */
  padding: 0 1.25rem;
  overflow-wrap: anywhere;        /* long URLs in notes must not cause horizontal scroll */
}
body:has(dialog[open]) { overflow: hidden; } /* lock background scroll */
```

Rules:

- Buttons live in the fixed footer, never inside the scrolling area, so they are reachable at small window sizes and 200% zoom.
- Release notes come from the manifest and are **untrusted**. Render as plain text or sanitized Markdown. Never use `dangerouslySetInnerHTML` on `update.body`.
- Keep Escape, focus return, and a visible focus ring. While installing, disable "Later" and ignore Escape; after a failure, re-enable them and show the error with `role="alert"`.
- Make the notes area keyboard-scrollable (`tabIndex={0}` plus an accessible name).
- Respect `prefers-reduced-motion` for any progress animation.

## 6. Remember "Later" and free the handle

```ts
const DISMISSED_KEY = 'updater:dismissedVersion';

export const dismissed = {
  get: () => { try { return localStorage.getItem(DISMISSED_KEY); } catch { return null; } },
  set: (v: string) => { try { localStorage.setItem(DISMISSED_KEY, v); } catch { /* ignore */ } },
};

// after check(): skip an automatic prompt for a version the user declined; a manual check always shows it
if (update && !manual && update.version === dismissed.get()) { await update.close(); return null; }
```

Call `update.close()` when the user dismisses the dialog so the Rust-side resource is released.

## 7. Dev and lifecycle

- Run automatic checks only in production builds (`import.meta.env.PROD`) and inside Tauri. A failed check must never block the app.
- Keep the timer cleanup in the effect so StrictMode and HMR remounts do not stack checks.
- Do not start a check while `installLock.current()` is set.
- On Windows the process exits during install; do not run code after `downloadAndInstall` that assumes the app is still alive, other than `relaunch()` on platforms that need it.

## Test matrix (manual; do it before announcing a release)

Serve an older build against a newer release, then on each OS you ship:

1. Press F5 and Ctrl+R during the download: no second download, UI shows "Finishing the update…", app recovers.
2. Click the window close button and press Alt+F4/Cmd+Q during the download: install is not interrupted, or the user is told clearly.
3. Disconnect the network mid-download: error shown, buttons re-enabled, app still closable and retry works.
4. Notes with 200 lines, a very long URL, and a code block: only the notes area scrolls, no horizontal scroll, buttons stay visible.
5. Resize to the minimum window size and zoom to 200%: dialog fits, footer reachable.
6. Double-click "Update": exactly one download.
7. Server without `Content-Length`: indeterminate bar, not 0%.
8. Press Escape and Tab during install: dialog stays, focus stays inside.
9. Choose "Later", relaunch: no re-prompt for that version; manual check still shows it.
10. Offline start: no dialog, no error toast, app fully usable.

## Sources

- [Tauri updater plugin](https://v2.tauri.app/plugin/updater/)
- [Tauri window events and close requests](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [MDN: HTMLDialogElement](https://developer.mozilla.org/docs/Web/API/HTMLDialogElement)
- [MDN: overscroll-behavior](https://developer.mozilla.org/docs/Web/CSS/overscroll-behavior)
