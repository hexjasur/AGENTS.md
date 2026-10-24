# Tauri v2 reference

Load this after `SKILL.md` when writing capabilities, commands, tests, or build settings.

## Capabilities (least privilege)

`src-tauri/capabilities/main.json`

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "main-capability",
  "description": "Permissions for the main window only",
  "windows": ["main"],
  "permissions": ["core:default", "core:window:allow-set-title"]
}
```

- Every file in the capabilities directory is enabled unless you list capabilities explicitly in `tauri.conf.json`; once listed, only those apply.
- Use `platforms` to limit a capability to certain targets, and `remote.urls` only when absolutely required, because on Linux and Android embedded iframes cannot be told apart from the window.
- Keep window-creation permissions on higher-privileged windows only.

## Content Security Policy

`src-tauri/tauri.conf.json`

```json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; connect-src ipc: http://ipc.localhost; img-src 'self' asset: http://asset.localhost blob: data:; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

- Tailor the policy to the app; start strict and add only what breaks.
- Do not load scripts from a CDN or other remote origins.
- Add `'wasm-unsafe-eval'` to `script-src` only for WebAssembly frontends.
- Avoid `withGlobalTauri` unless a non-bundled frontend needs it.

## Commands

```rust
use std::sync::Mutex;
use tauri::Manager;

#[derive(Debug, thiserror::Error)]
enum AppError {
    #[error("invalid input: {0}")]
    Invalid(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

struct Counter(Mutex<u32>);

#[tauri::command]
fn bump(state: tauri::State<Counter>) -> u32 {
    let mut n = state.0.lock().unwrap();
    *n += 1;
    *n
}

#[tauri::command]
async fn read_notes(app: tauri::AppHandle, name: String) -> Result<String, AppError> {
    // The frontend is untrusted: accept a plain file name only.
    if name.is_empty() || name.contains(['/', '\\']) || name.contains("..") {
        return Err(AppError::Invalid(name));
    }
    let dir = app.path().app_data_dir().map_err(|e| AppError::Invalid(e.to_string()))?;
    let path = dir.join(format!("{name}.txt"));
    tauri::async_runtime::spawn_blocking(move || std::fs::read_to_string(path))
        .await
        .map_err(|e| AppError::Invalid(e.to_string()))?
        .map_err(AppError::from)
}

pub fn run() {
    tauri::Builder::default()
        .manage(Counter(Mutex::new(0)))
        .invoke_handler(tauri::generate_handler![bump, read_notes])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

```ts
import { invoke } from '@tauri-apps/api/core';

const notes = await invoke<string>('read_notes', { name: 'today' }).catch((e) => {
  console.error(e);
  return '';
});
```

- Use `Channel` to stream progress or chunks, and `listen`/`emit` for simple notifications. Store the `unlisten` handle and call it on unmount.
- Return `tauri::ipc::Response` for large binary data to avoid JSON overhead.
- Restrict which commands exist for each window with an app manifest in `build.rs` when needed.

## Testing

- **Rust:** build the app with Tauri's mock runtime (`tauri::test`) so tests do not start a real webview.
- **Frontend:** use `@tauri-apps/api/mocks` (`mockIPC`, `mockWindows`) to test components that call `invoke`.
- **End to end:** WebDriver works on Windows and Linux; macOS has no desktop WebDriver client, so cover macOS with unit tests and manual smoke tests.
- **CI:** every target platform needs the native libraries to compile (on Ubuntu: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`, `xdg-utils`).

```yaml
- run: cargo fmt --manifest-path src-tauri/Cargo.toml --check
- run: cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
- run: cargo test --manifest-path src-tauri/Cargo.toml
```

## Size and performance

`src-tauri/Cargo.toml`

```toml
[profile.dev]
incremental = true

[profile.release]
codegen-units = 1
lto = true
opt-level = "s"
panic = "abort"
strip = true
```

- `opt-level = "s"` favors size; use `3` for speed or `"z"` for the smallest binary.
- Enable `"build": { "removeUnusedCommands": true }` in `tauri.conf.json` (needs recent Tauri 2.4+ tooling) and list only the permissions you use instead of defaults. Commands added to ACLs dynamically at runtime are not accounted for.
- Keep the frontend lean: code-split, lazy-load windows and heavy views, compress images, and avoid shipping unused icon or font sets.

## CI and signing

- Use `tauri-apps/tauri-action` on a matrix with `fail-fast: false`, `contents: write` on the release job, `swatinem/rust-cache`, and a draft release. See `tauri-auto-update` for the full release pipeline.
- Windows: sign with an OV/EV certificate, Azure Artifact Signing, or a custom `signCommand`. SmartScreen reputation accumulates per certificate and file.
- macOS: sign with a Developer ID certificate and notarize.
- Updater signing (`TAURI_SIGNING_PRIVATE_KEY`) is separate from OS code signing and is required for updates.

## Sources

- [Tauri security: capabilities](https://v2.tauri.app/security/capabilities/)
- [Tauri security: CSP](https://v2.tauri.app/security/csp/)
- [Calling Rust from the frontend](https://v2.tauri.app/develop/calling-rust/)
- [Reducing app size](https://v2.tauri.app/concept/size/)
- [Testing](https://v2.tauri.app/develop/tests/)
- [Windows code signing](https://v2.tauri.app/distribute/sign/windows/)
- [macOS code signing](https://v2.tauri.app/distribute/sign/macos/)
- [GitHub Actions pipeline](https://v2.tauri.app/distribute/pipelines/github/)
