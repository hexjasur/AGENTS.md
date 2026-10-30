---
name: rust-best-practices
description: Write, review, and harden Rust code for applications, CLIs, and Tauri backends: ownership and borrowing, error handling with thiserror and anyhow, async with Tokio, unsafe, clippy, rustfmt, cargo-audit and cargo-deny, testing, and release builds. Use when writing or reviewing Rust, fixing borrow checker or lifetime errors, designing error types, handling async and blocking work, or setting up Rust CI.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-30"
---

# Rust Best Practices

Let the compiler carry the design: encode invariants in types, return errors instead of panicking, and keep `unsafe` out unless it is isolated and justified. Prefer the simplest ownership model that works before reaching for `Arc<Mutex<_>>` or lifetimes.

## Procedure

```text
- [ ] 1. Read Cargo.toml, edition, MSRV, features, and the existing error and async style
- [ ] 2. Model data with types and make invalid states unrepresentable
- [ ] 3. Return Result with a typed error; no unwrap in non-test code
- [ ] 4. Choose ownership: borrow first, clone deliberately, share only when needed
- [ ] 5. Keep async code non-blocking and cancellation-safe
- [ ] 6. Run fmt, clippy, tests, and dependency audits
- [ ] 7. Check the release profile and binary size when it matters
```

1. Follow the project's edition, `rust-version`, workspace layout, and error crate. Check `cargo tree -d` for duplicate versions before adding a dependency.
2. Use enums for states, newtypes for validated values (`struct UserId(u64)`), and `Option` for absence. Parse input into a typed value once at the boundary instead of passing raw strings around.
3. Libraries define an error enum with `thiserror`; applications and command handlers may use `anyhow` with `.context(...)`. Use `?` for propagation. In Tauri commands, map errors to a serializable type; never return internal paths or secrets to the frontend.
4. Accept `&str`, `&[T]`, and `&Path` in parameters, return owned values. Clone only when ownership is truly needed and say why in review. Use `Cow` when a function sometimes allocates. Reach for `Arc` only for data shared across threads or tasks, and prefer message passing over shared mutable state.
5. Never call blocking code (file reads, heavy compute, `std::thread::sleep`) on an async executor thread; use `spawn_blocking` or an async API. Do not hold a `std::sync::Mutex` guard across `.await`. Make futures safe to drop, and bound channels and concurrency.
6. Run `cargo fmt --check`, `cargo clippy --all-targets --all-features -- -D warnings`, `cargo test`, and `cargo doc --no-deps` for library crates. Add `cargo audit` and `cargo deny check` in CI.
7. For shipped binaries, set a release profile (`lto`, `codegen-units = 1`, `strip`, `opt-level`, `panic = "abort"` only if acceptable) and measure the size before and after.

## Guardrails

- Never use `unwrap()` or `expect()` on input, I/O, or parsing outside tests, examples, and proven invariants (document the invariant in the `expect` message).
- Never write `unsafe` without a `// SAFETY:` comment stating the invariant, and keep it in the smallest function that can uphold it.
- Never silence clippy with a blanket `#![allow(...)]`; allow a single lint on a single item with a reason.
- Never hold a lock across an `.await`, and never block the async runtime.
- Never build shell commands or file paths by string concatenation with untrusted data; use `Command::arg` and `Path::join` with validation.
- Never log secrets or tokens, and never `derive(Debug)` on a type that holds them without redaction.
- Do not use `panic!` for recoverable errors, and do not ignore a `Result` with `let _ =` without a comment.
- Do not add a dependency for a few lines of code, and do not publish crates or cut releases without explicit instruction.

## Gotchas

- A borrow checker fight often means the data layout is wrong. Split the struct, pass fields separately, restructure ownership, or use indices instead of references; do not add `clone()` to silence it blindly.
- `String` slicing by byte index panics on non-ASCII text. Use `chars()`, `char_indices()`, or `str::get`.
- Integer overflow wraps in release builds. Use `checked_*`, `saturating_*`, or `wrapping_*` explicitly where input is untrusted.
- `tokio::spawn` needs `'static + Send` futures; borrowed data and `Rc` or `std::sync::MutexGuard` across `.await` fail here.
- `select!` can drop a branch's future mid-work. Make that work cancellation-safe or move it to a task.
- Feature unification means one crate enabling a feature enables it for everyone. Test with `--no-default-features` and `--all-features`.
- `cargo update` can break the build; commit `Cargo.lock` for applications and review the diff.
- Clippy suggestions can change behavior (for example removing a clone that preserved a snapshot). Run tests after applying them.

## Report format

State what changed, the error and ownership design chosen, which commands ran (`fmt`, `clippy`, `test`, `audit`), and what was not run. List findings by severity (unsound or panic path, blocking in async, leaked secret, missing context, style), each with location and fix.

Read `references/rust-reference.md` for error type, async, Tauri command, CI, and release profile snippets and sources.
