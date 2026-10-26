---
name: error-handling-observability
description: Design reliable error handling, structured logging, metrics, tracing, alerting, and incident diagnostics without leaking sensitive data. Use when adding or reviewing error paths, logging, telemetry, retries, health checks, or production debugging.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-26"
---
# Error Handling and Observability

Make failures explicit, diagnosable, and safe. Preserve the original cause while giving users actionable, non-sensitive messages.

## Procedure

1. Inspect the existing logging, tracing, error-boundary, and monitoring stack. Reuse it; do not introduce a competing vendor or dependency without approval.
2. Map expected failures, transient failures, programming defects, and cancellation separately. Define what callers and users should observe for each.
3. Handle failures at the boundary that can recover or add useful context. Preserve causes and typed error information; return or throw rather than silently swallowing errors.
4. Emit structured, searchable events with stable event names and useful fields such as operation, component, request/trace ID, and outcome. Redact credentials, tokens, personal data, and secret-bearing payloads before logging.
5. Add metrics and traces only for actionable service behavior. Use bounded-cardinality labels; do not put user IDs, raw URLs, or unbounded error text in metric labels.
6. Retry only transient, idempotent operations. Bound attempts and elapsed time, use backoff with jitter, honor cancellation and `Retry-After`, and avoid retry storms.
7. Make health checks reflect the purpose: liveness should detect a stuck process; readiness should report whether it can serve. Do not expose secrets or detailed internals in public endpoints.
8. Test expected errors, unexpected errors, timeout/cancellation, retry exhaustion, redaction, and recovery. Confirm logs and telemetry retain enough context without private data.
9. Report the failure policy, telemetry added, tests run, and any monitoring or alert configuration still needed.

## Guardrails

- Never log secrets, authorization headers, passwords, raw session cookies, or unredacted sensitive request/response bodies.
- Never use an empty catch, a catch that only logs and continues, or a blanket fallback that hides data loss.
- Never retry non-idempotent writes unless the operation has an idempotency mechanism.
- Never create alerts without a clear owner, user impact, and response action.
- Do not turn expected user errors into high-severity incident signals; keep severity aligned with impact.

## Gotchas

- Logging and rethrowing the same error at every layer creates duplicate noise. Add context once at the boundary that owns the operation.
- High-cardinality metric labels can make telemetry expensive and unusable. Put detailed values in traces or structured logs instead.
- A timeout does not prove the remote operation failed; callers may need idempotency keys before retrying.
- A healthy process may still be unable to serve traffic; separate liveness from readiness.

Read `references/production-checklist.md` when designing production telemetry, alerting, retry, or health-check policy.

## Report format

For reviews, list findings by severity with file or operation, user/operational impact, and a concrete fix. State which failure cases and privacy risks were tested, and identify dashboards or alerts that require operator setup.
