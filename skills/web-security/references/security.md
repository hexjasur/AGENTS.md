# Web security checklist

Review HTTPS, HSTS where appropriate, secure/httpOnly/SameSite cookies, CSRF, CORS origins, CSP, frame and MIME protections, referrer policy, permissions policy, dependency provenance, rate limits, authorization on every server action, upload constraints, redirect validation, and safe error handling.

Keep secrets server-side. Avoid leaking tokens through URLs, logs, source maps, client bundles, analytics, or error reports. Treat browser checks as defense-in-depth; authorization belongs at the server boundary.

## Sources

- [Why HTTPS matters — Google for Developers](https://developers.google.com/web/fundamentals/security/encrypt-in-transit/why-https)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
