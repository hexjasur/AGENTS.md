# Production Reliability Checklist

Use this when work changes production-facing error handling, telemetry, retries, or health endpoints.

## Errors and logs

- Define stable error codes and preserve the original cause when wrapping errors.
- Separate expected validation/authentication failures from service faults.
- Include operation name, service/component, trace or request ID, and outcome where available.
- Redact secrets and personal data at the logging boundary; test redaction with representative values.
- Avoid duplicating the same exception at each layer. Log once where useful context is known.

## Metrics and traces

- Prefer counters for outcomes, histograms for latency/size, and gauges only for values with meaningful current state.
- Keep label dimensions bounded (route template, status class, dependency name); avoid IDs, raw paths, arbitrary messages, and user input.
- Use trace spans around meaningful boundaries and propagate context through async work and remote calls.
- Sample high-volume traces deliberately; retain error traces only within privacy and cost policies.

## Retries and timeouts

- Set an end-to-end deadline and propagate cancellation.
- Retry only transient failures and idempotent operations; use bounded exponential backoff with jitter.
- Respect server retry guidance and avoid retrying after the caller's deadline.
- Use idempotency keys or deduplication for operations whose outcome may be unknown after a timeout.

## Alerts and health

- Alert on user-visible symptoms or SLO burn, not every exception or CPU fluctuation.
- Each alert needs a named owner, impact, runbook, and actionable response.
- Liveness answers whether restart is needed; readiness answers whether traffic should be sent.
- Keep public health output minimal and never reveal credentials, stack traces, or dependency internals.
