# Rust reference

Load this after `SKILL.md` when implementing or reviewing Rust. Check versions and flags against the current toolchain.

## Error types

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("file not found: {0}")]
    NotFound(String),
    #[error("invalid input: {0}")]
    Invalid(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

// Applications and command handlers
use anyhow::{Context, Result};
fn load(path: &std::path::Path) -> Result<String> {
    std::fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))
}
```

- Libraries expose typed errors; binaries add context and print once at the top.
- Implement `serde::Serialize` for an error returned to a webview, sending a stable code and a safe message, not the raw `Display` of an internal error.

## Tauri command shape

```rust
#[tauri::command]
async fn read_note(state: tauri::State<'_, AppState>, id: u64) -> Result<Note, CommandError> {
    let db = state.db.clone();
    tauri::async_runtime::spawn_blocking(move || db.get_note(id))
        .await
        .map_err(|_| CommandError::Internal)?
        .map_err(CommandError::from)
}
```

- Validate every argument from the frontend; the webview is an untrusted caller.
- Keep commands thin: parse, authorize, call a plain function, map the error. Test the plain function.

## Async patterns

- Bound concurrency with `tokio::sync::Semaphore` or `buffer_unordered(n)`.
- Use `tokio::time::timeout` around network calls, and a `CancellationToken` for shutdown.
- Use bounded `mpsc` channels; an unbounded channel hides back-pressure bugs.
- Share state with `Arc<T>` for read-only data, `Arc<tokio::sync::Mutex<T>>` only when a guard must cross `.await`, otherwise `Arc<std::sync::Mutex<T>>` with short critical sections.

## Testing

- Unit tests next to the code (`#[cfg(test)] mod tests`), integration tests in `tests/`.
- Use `#[tokio::test]` for async tests; avoid real network and sleeps, and use temporary directories (`tempfile`) for file work.
- Property tests (`proptest`) for parsers and numeric code; `cargo test --doc` keeps examples honest.

## CI baseline

```yaml
- run: cargo fmt --all --check
- run: cargo clippy --all-targets --all-features -- -D warnings
- run: cargo test --all-features --locked
- run: cargo deny check
```

- Pin the toolchain in `rust-toolchain.toml` and cache `~/.cargo` and `target` by `Cargo.lock` hash.
- Run `cargo audit` on a schedule as well as on pull requests.

## Release profile

```toml
[profile.release]
lto = true
codegen-units = 1
strip = true
opt-level = "s"   # or 3 when speed matters more than size
```

- Measure with `cargo bloat` or the final bundle size; keep `panic = "abort"` only if no code relies on unwinding or `catch_unwind`.

## Sources

- The Rust Book: https://doc.rust-lang.org/book/
- Rust API Guidelines: https://rust-lang.github.io/api-guidelines/
- Clippy lints: https://rust-lang.github.io/rust-clippy/master/
- Tokio tutorial: https://tokio.rs/tokio/tutorial
- cargo-deny: https://embarkstudios.github.io/cargo-deny/
- RustSec advisory database: https://rustsec.org/
