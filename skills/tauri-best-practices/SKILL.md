---
name: tauri-best-practices
description: Build, secure, test, shrink, and ship Tauri v2 apps with least-privilege capabilities, a strict CSP, well-designed Rust commands and IPC, sound project structure, release-profile optimization, mock-runtime tests, cross-platform webview checks, and CI builds with code signing. Use when starting or reviewing a Tauri project, writing Rust commands or events, configuring capabilities or CSP, reducing bundle size, setting up CI, or debugging IPC and platform differences.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# Tauri Best Practices

A Tauri app is a Rust core plus a web frontend in a system webview. Treat the frontend as untrusted input, grant the minimum native power, and test on every platform you ship.

## Procedure

```text
- [ ] 1. Confirm versions and structure (tauri, CLI, @tauri-apps/*, plugins)
- [ ] 2. Lock down: capabilities, CSP, scopes, command inputs
- [ ] 3. Design commands and IPC: errors, async, state, channels
- [ ] 4. Test: Rust with the mock runtime, frontend with IPC mocks, E2E where supported
- [ ] 5. Optimize: release profile, unused commands, frontend bundle
- [ ] 6. Ship: CI matrix, signing, updater (see tauri-auto-update)
```

1. Run `tauri info` to see the real toolchain. Keep the `tauri` crate, `tauri-cli`, `@tauri-apps/api`, and every official plugin on the same minor line. Put the frontend in `src/` and Rust in `src-tauri/`, with app logic in `lib.rs` (`run()`) and a thin `main.rs`, which also keeps the project mobile-ready.
2. Grant permissions per window through capability files in `src-tauri/capabilities/`. Set `app.security.csp` (it is **off** unless configured). Scope file, shell, and HTTP access to specific paths, programs, and URLs. Validate every command argument in Rust.
3. Return `Result<T, E>` with a `Serialize` error type, use `async` for slow work, stream with channels, and use events only for simple notifications. Details and code are in `references/tauri-reference.md`.
4. Unit and integration test Rust with Tauri's mock runtime, mock IPC in frontend tests, and run WebDriver E2E on Windows and Linux. Run `cargo fmt`, `cargo clippy`, and your frontend lint and typecheck in CI.
5. Apply the release profile from the reference, enable `build.removeUnusedCommands` with a tight ACL, and keep the frontend bundle small. Measure binary and bundle size before and after.
6. Build with `tauri-action` on a matrix of the platforms you ship, sign each platform, and publish through a pipeline that verifies artifacts. For auto-update, use the `tauri-auto-update` skill.

## Guardrails

- Never treat the frontend as trusted. Re-validate paths, URLs, sizes, and permissions in Rust.
- Never load remote scripts (CDNs, remote content) into the app window. Bundle everything.
- Never grant broad permissions "to make it work". Add the one permission needed, scoped, for the one window that needs it.
- Never expose shell execution, arbitrary file reads, or arbitrary HTTP to the webview without a tight scope.
- Never hardcode user paths. Use Tauri's path APIs (`app.path()` or the path JS API) and the app data directory.
- Never commit signing keys, certificates, or tokens. Use CI secrets.
- Never call blocking work on the main thread from a command; use `async` or a worker.
- Do not use `unwrap()` or `expect()` on user-driven paths in commands; return errors.

## Gotchas

- Capabilities are matched by **window label**, not title. A window listed in several capabilities gets the union of all of them.
- Capabilities do not protect against insecure Rust code or overly broad scopes. Review command bodies too.
- By default every registered command is callable from every window. Restrict commands in `build.rs` with an app manifest when windows differ.
- Frontend `invoke` arguments are camelCase by default; Rust parameters are snake_case. Use `rename_all` if you need to change that.
- Async commands cannot take borrowed arguments such as `&str` or `State<'_, T>` directly; take owned types or return `Result`.
- Do not hold a `std::sync::Mutex` guard across an `.await`. Use an async-aware lock or scope the guard.
- Events are untyped, async, and one-way. Use channels for streaming and `tauri::ipc::Response` for large binary payloads. Always call the `unlisten` function on cleanup.
- Commands in `lib.rs` must not be `pub`; commands in modules must be. Register all commands in a **single** `generate_handler!`, because a second `invoke_handler` call replaces the first.
- The webview differs per OS (WebView2, WKWebView, WebKitGTK). Test CSS and APIs on each, target a Baseline level, and see `modern-web-guidance` for fallbacks.
- Windows SmartScreen reputation builds per certificate and file; an EV certificate no longer gives instant reputation. Sign every release with the same certificate.
- Cross-compiling Windows installers from Linux or macOS needs a custom sign command.
- The Linux updater works with AppImage only.
- The CSP only applies when set in the config. Tauri adds nonces and hashes for bundled assets at build time; WebAssembly needs `'wasm-unsafe-eval'` in `script-src`.

## Report format

For a review: group findings by security, correctness, performance and size, platform differences, and release. Give the file, the risk, and the fix, ordered by severity, and state which platforms and builds were actually tested.

Read `references/tauri-reference.md` for capability, CSP, command, state, test, Cargo profile, and CI snippets, plus sources.
