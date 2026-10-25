---
name: web-security
description: Threat-model, review, and harden web applications, APIs, forms, sessions, cookies, browser security headers, uploads, and third-party code. Use when handling authentication, authorization, user input or rendering, secrets, CORS or CSP, file uploads, redirects, dependencies, or a pre-release security review.
license: MIT
metadata:
  author: hexjasur
  version: "1.1.0"
  last_reviewed: "2026-10-25"
---

# Web Security

Threat-model before implementing. Minimize trust, validate on the server, keep secrets and personal data out of client code and logs, and layer defenses so one mistake is not a breach.

## Procedure

```text
- [ ] 1. Map assets, trust boundaries, and attacker-controlled inputs
- [ ] 2. Authentication, session, and authorization checks on the server
- [ ] 3. Input handling and output encoding for every sink
- [ ] 4. Transport, cookies, and browser policy headers
- [ ] 5. Secrets, dependencies, and supply chain
- [ ] 6. Tests for abuse cases, then verify headers in a production-like environment
```

1. List what is worth attacking (accounts, payments, personal data, admin actions), every place data crosses a trust boundary, and who can reach it. Include third-party scripts, webhooks, and background jobs.
2. Authenticate with a vetted library or identity provider, not custom crypto. Offer passkeys (WebAuthn) or MFA. Authorize **every** request on the server against the resource, not just the route (prevents IDOR / broken object-level authorization). Deny by default.
3. Validate type, length, range, and format at the boundary with a schema. Use parameterized queries, context-aware output encoding, and a vetted sanitizer for untrusted HTML. Prefer `textContent` over `innerHTML`.
4. HTTPS only with HSTS, cookies set `Secure; HttpOnly; SameSite=Lax` (or `Strict`), a Content Security Policy, and the other headers in `references/security.md`.
5. Keep secrets in a secret manager or environment, rotate on exposure, commit lockfiles, review dependency diffs, and run an audit in CI.
6. Add tests for unauthorized access, another user's resource, malformed and oversized input, and CSRF. Confirm headers on the deployed build, not only in code.

## Guardrails

- Never trust the client: hidden fields, JWT claims you did not verify, `Origin`, and `Referer` are inputs, not proof.
- Never commit API keys, tokens, passwords, or private keys. A secret that reached git history is compromised; rotate it, do not just delete it.
- Never build SQL, shell commands, file paths, or HTML by string concatenation with user data.
- Never use `eval`, `new Function`, `dangerouslySetInnerHTML`, or `innerHTML` with untrusted data without a reviewed sanitizer.
- Never use `Access-Control-Allow-Origin: *` with credentials, or reflect the `Origin` header without an allowlist.
- Never log credentials, session identifiers, tokens, or sensitive personal data, and keep them out of URLs and error messages shown to users.
- Do not roll your own authentication, session store, password hashing, or encryption.
- Do not weaken a control to make a test or demo pass.

## Gotchas

- `SameSite` is not a complete CSRF defense. Keep CSRF tokens or verify `Sec-Fetch-Site` and `Origin` on state-changing requests.
- A CSP with `unsafe-inline` or a broad `script-src` allowlist gives little XSS protection. Use nonces or hashes with `strict-dynamic`.
- Open redirects and SSRF come from user-supplied URLs. Allowlist hosts, resolve and block private address ranges, and disable redirects you do not need.
- File uploads: check type by content, cap size, rename, store outside the web root or on object storage, and never serve user files from your main origin.
- JWTs in `localStorage` are readable by any XSS. Prefer server-side sessions or short-lived tokens in `HttpOnly` cookies.
- Source maps, debug endpoints, verbose errors, and `.git` or `.env` on the web root leak internals.
- Do not use `X-XSS-Protection`; it is obsolete and can introduce vulnerabilities. Use CSP.
- Security headers reduce impact; they do not replace fixing the bug.

## Report format

For each finding: location, class (CWE or OWASP category), impact, proof or reproduction, and fix, ordered by severity. State what was reviewed and what was not. If a secret is exposed, say to rotate it first.

Read `references/security.md` for the header set, cookie and CORS settings, checklists, and sources.
