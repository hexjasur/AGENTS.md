---
name: numerical-methods
description: Implement, test, and document numerical algorithms: root finding (bisection, Newton, secant), interpolation, numerical integration and differentiation, linear systems, ODE solvers, and least squares. Use when writing or reviewing numeric code, handling floating-point error, choosing tolerances and stopping criteria, checking convergence and order, or writing tests and docs for a numerical methods library or course repository.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-30"
---

# Numerical Methods

A numerical method is correct only if its error behaves as theory predicts. Pick the method from the problem's conditions, state the stopping rule, and prove behavior with tests against known answers and measured convergence order.

## Procedure

```text
- [ ] 1. State the problem, domain, assumptions, and required accuracy
- [ ] 2. Choose a method that fits the conditions (smoothness, bracket, conditioning)
- [ ] 3. Implement with explicit tolerance, iteration cap, and failure results
- [ ] 4. Test against exact solutions and edge cases
- [ ] 5. Measure convergence order and error versus step size
- [ ] 6. Document the method, its limits, and a runnable example
```

1. Write the equation or system, the interval or initial guess, whether the function is smooth or continuous, and the accuracy target (absolute, relative, or both).
2. Match method to conditions. Bisection needs a sign change and always converges. Newton is fast near a simple root but needs a derivative and a good guess. Prefer a bracketing method with a fast fallback (Brent) for production. For linear systems use LU with partial pivoting, not an explicit inverse. For stiff ODEs use implicit methods.
3. Take `tol` and `max_iter` as parameters. Stop on a combined criterion (`abs(step) <= atol + rtol * abs(x)` and a residual check), return the iteration count and an explicit status, and raise or flag non-convergence instead of returning a silent wrong answer.
4. Test against functions with known results (`x**2 - 2`, `sin`, `exp`, polynomials up to the method's exact degree), plus edge cases: zero derivative, no sign change, singular or ill-conditioned matrix, `NaN` or infinite input, and very large or tiny scales.
5. Halve the step `h` repeatedly and confirm the error shrinks by the expected factor (about 4 for second order, 16 for fourth). Plot or tabulate error against `h` on a log scale, and check that roundoff takes over at very small `h`.
6. Document the formula, order of accuracy, conditions, cost per iteration, and a short worked example with expected output.

## Guardrails

- Never compare floating-point values with `==`; use a tolerance (`math.isclose`, `numpy.isclose`) with both absolute and relative parts.
- Never compute `A⁻¹b` explicitly; solve the system with a factorization.
- Never loop without an iteration cap, and never return a result without a convergence status.
- Never subtract nearly equal numbers if an algebraically equivalent stable form exists.
- Never choose a tolerance below what the data or double precision (about `1e-16` relative) can support.
- Never assert convergence order from a single run; measure it over several step sizes.
- Do not use a fixed-step method when the solution changes scale rapidly; use an adaptive step with error control.
- Do not hide a method's failure case (division by zero derivative, non-bracketing interval); report it clearly.

## Gotchas

- Truncation error falls as `h` shrinks, but roundoff error grows. The best `h` for a forward difference is near `sqrt(eps)` (about `1e-8`), not as small as possible.
- Summing many terms loses accuracy; sum small to large, use `math.fsum`, or Kahan compensation.
- Newton diverges or cycles on bad starting points and flat regions; add a bracket, a damping step, or a fallback.
- Interpolating many equally spaced points with a high-degree polynomial oscillates (Runge phenomenon); use splines or Chebyshev nodes.
- A small residual does not imply a small error when the system is ill-conditioned; check the condition number.
- Simpson's rule needs an even number of intervals; an off-by-one in the loop silently loses accuracy.
- Relative error is meaningless when the true value is near zero; add an absolute floor.
- Seed random inputs in tests so failures are reproducible, and compare against a trusted library (`scipy`, `numpy`) rather than a second copy of your own code.

## Report format

State the method, conditions checked, tolerance and stopping rule, test cases and results, measured convergence order, and known failure modes. Show an error table (step or iteration versus error). Say what was not tested.

Read `references/methods.md` for formulas, order of accuracy, stopping criteria, test patterns, and sources.
