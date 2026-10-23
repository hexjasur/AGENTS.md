---
name: web-security
description: Review and harden web applications, APIs, forms, cookies, browser policies, and deployment configuration. Use when handling authentication, user input, sensitive data, third-party scripts, uploads, or production security headers.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
---

# Web Security

Threat-model the change before implementation. Minimize trust, validate at boundaries, and keep secrets and user data out of client code and logs.

## Workflow

1. Map assets, trust boundaries, user-controlled inputs, authentication/authorization checks, storage, third parties, and sensitive data.
2. Validate and normalize input at the server boundary; use parameterized queries and context-appropriate output encoding.
3. Enforce HTTPS everywhere, secure cookie attributes, CSRF protection where applicable, strict CORS, and least-privilege access.
4. Review dependency and supply-chain impact, upload handling, redirects, error messages, source maps, and client-exposed configuration.
5. Add focused tests for authorization failures and malformed input. Recheck headers and browser behavior in a production-like environment.

## Never do

- Never place API keys, tokens, passwords, or private identifiers in committed client code.
- Never treat client-side validation as authorization.
- Never add `innerHTML`, dynamic script execution, or permissive CORS without a security review.
- Never log credentials, session tokens, or sensitive personal data.
- Read `references/security.md` for the checklist and official references.
