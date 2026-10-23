# Web security reference

Load this after `SKILL.md` when reviewing or hardening a web app. Treat the values below as starting points and test them against the real application.

## Baseline response headers

```http
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'nonce-{random}' 'strict-dynamic'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Cross-Origin-Opener-Policy: same-origin
```

- Generate a fresh unpredictable nonce per response. Roll CSP out with `Content-Security-Policy-Report-Only` first, then enforce.
- Add `preload` to HSTS only after every subdomain serves HTTPS and you accept the commitment.
- `frame-ancestors` replaces `X-Frame-Options`; keep both only for legacy clients.
- Use `Cross-Origin-Embedder-Policy` and `Cross-Origin-Resource-Policy` when you need cross-origin isolation or want to stop other sites loading your resources.
- Consider `require-trusted-types-for 'script'` where supported to remove DOM XSS sinks.
- Set `Cache-Control: no-store` on responses with sensitive or per-user data.

## Cookies and sessions

- Session cookie: `Secure; HttpOnly; SameSite=Lax; Path=/`, with the `__Host-` prefix where possible (requires `Secure`, `Path=/`, no `Domain`).
- Rotate the session identifier on login and privilege change; expire it server-side on logout; set idle and absolute timeouts.
- Hash passwords with Argon2id, scrypt, or bcrypt through a maintained library. Rate-limit and monitor login, reset, and MFA endpoints. Return the same message for unknown user and wrong password.
- Never put secrets or sensitive data in JWT payloads; they are encoded, not encrypted. Pin the accepted algorithm and verify `iss`, `aud`, and `exp`.

## CORS

- Allowlist exact origins; never reflect an arbitrary `Origin`, and never combine `*` with credentials.
- Restrict methods and headers, and set a bounded `Access-Control-Max-Age`.
- CORS is a browser read policy, not authentication. Servers still authorize every request.

## Input and output

- Validate with an allowlist schema (type, length, range, enum) at every boundary, and reject rather than silently fix.
- Encode for the output context: HTML text, attribute, URL, JavaScript, and CSS differ.
- Untrusted HTML needs a maintained sanitizer (for example DOMPurify) or the browser Sanitizer API where supported, plus CSP as a second layer.
- Databases: parameterized queries or an ORM's bound parameters; least-privilege database accounts.
- Redirects and fetches: allowlist destinations; block link-local and private ranges for server-side requests (SSRF), including via redirects and DNS rebinding.

## Authorization

- Check ownership and role on the server for every object access, in a central policy layer, with deny by default.
- Test as a second user and as an unauthenticated client for each endpoint and each object ID.
- Re-verify on sensitive actions (step-up authentication) and log them with actor, target, and time.

## Supply chain and secrets

- Commit the lockfile; install with `npm ci`, `pnpm install --frozen-lockfile`, or the equivalent; review dependency diffs and install scripts.
- Run `npm audit` (or the ecosystem equivalent) and automated update PRs; pin CI actions to a commit SHA and grant workflows least-privilege tokens.
- Add Subresource Integrity (`integrity` with `crossorigin`) to third-party scripts and styles you cannot self-host; prefer self-hosting.
- Scan for secrets in pre-commit and CI. Rotate anything exposed. Prefer short-lived, scoped credentials and OIDC over long-lived tokens.

## Pre-release checklist

- [ ] HTTPS everywhere, HSTS, no mixed content
- [ ] Headers above present and verified on the deployed URL
- [ ] Cookies flagged correctly; CSRF defense on state-changing requests
- [ ] Authorization tested per endpoint and per object
- [ ] Inputs validated server-side; outputs encoded; uploads constrained
- [ ] No secrets in repo, bundle, source maps, logs, or error reports
- [ ] Dependencies audited; lockfile committed; CI tokens least-privilege
- [ ] Rate limiting and logging on authentication and sensitive actions
- [ ] Error pages and debug endpoints leak nothing

## Sources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [MDN Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
- [web.dev: Strict CSP](https://web.dev/articles/strict-csp)
- [Why HTTPS matters — Google for Developers](https://web.dev/articles/why-https-matters)
