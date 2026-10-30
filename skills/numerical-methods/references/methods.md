# Numerical methods reference

Load this after `SKILL.md` when choosing, implementing, or testing a method. Examples use Python, but the rules are language-neutral.

## Method selection

| Problem | Method | Order | Needs | Watch for |
| --- | --- | --- | --- | --- |
| Root of f(x) = 0 | Bisection | linear (halves interval) | sign change on [a, b] | slow but safe |
| Root of f(x) = 0 | Newton | quadratic (simple root) | f' and a close guess | zero derivative, divergence |
| Root of f(x) = 0 | Secant | about 1.62 | two guesses | may diverge |
| Root of f(x) = 0 | Brent | superlinear | bracket | robust default |
| Integral | Trapezoid | 2 | smooth f | many points for accuracy |
| Integral | Simpson | 4 | even interval count | non-smooth f |
| Integral | Gauss-Legendre | 2n for n points | smooth f | fixed nodes |
| Derivative | Central difference | 2 | smooth f | choose h near eps^(1/3) |
| Linear system | LU with partial pivoting | direct | square, nonsingular | conditioning |
| Linear system | Jacobi, Gauss-Seidel | iterative | diagonal dominance | slow or no convergence |
| ODE | Euler | 1 | any | unstable for stiff problems |
| ODE | RK4 | 4 | smooth f | fixed step cost |
| ODE | RK45 or implicit | adaptive | tolerances | stiffness |
| Fit | Least squares via QR or SVD | direct | tall matrix | never use normal equations on ill-conditioned data |

## Stopping criteria

```python
def converged(x_new, x_old, f_new, atol, rtol, ftol):
    step_ok = abs(x_new - x_old) <= atol + rtol * abs(x_new)
    resid_ok = abs(f_new) <= ftol
    return step_ok and resid_ok
```

- Use both a step test and a residual test; either alone can be fooled.
- Return a result object: `value`, `iterations`, `converged`, `residual`, and an error message on failure.

## Bisection with explicit failure

```python
def bisect(f, a, b, atol=1e-12, max_iter=200):
    fa, fb = f(a), f(b)
    if fa * fb > 0:
        raise ValueError("f(a) and f(b) must have opposite signs")
    for i in range(1, max_iter + 1):
        m = a + (b - a) / 2          # avoids overflow of (a + b)
        fm = f(m)
        if fm == 0 or (b - a) / 2 <= atol:
            return m, i
        if fa * fm < 0:
            b, fb = m, fm
        else:
            a, fa = m, fm
    raise RuntimeError("bisect did not converge")
```

## Measuring convergence order

```python
import math
def observed_order(errors, steps):
    return [math.log(errors[i] / errors[i + 1]) / math.log(steps[i] / steps[i + 1])
            for i in range(len(errors) - 1)]
```

- Run with `h, h/2, h/4, h/8`; the observed order should approach the theoretical order until roundoff dominates.
- For iterative methods, check that the error ratio `e[k+1] / e[k]**p` settles to a constant for the expected `p`.

## Test patterns

- Known answers: `sqrt(2)`, `integral of sin on [0, pi] = 2`, `d/dx exp(x) = exp(x)`, polynomial integrated exactly by Simpson up to degree 3.
- Property checks: integral of a constant, linearity, `A @ x` close to `b` for solved systems, symmetry of interpolation.
- Edge cases: single interval, `n = 1`, reversed bounds, zero step, empty input, singular matrix (expect an error), `NaN`.
- Compare with `scipy.optimize`, `scipy.integrate`, and `numpy.linalg` using tolerances scaled to the problem.
- Mark slow convergence studies separately from fast unit tests.

## Floating-point facts

- Double precision machine epsilon is about `2.2e-16`; about 15 to 16 significant decimal digits.
- `0.1 + 0.2 != 0.3`; this is expected, not a bug.
- Catastrophic cancellation example: `(1 - cos(x)) / x**2` for small `x`; rewrite with `2 * sin(x/2)**2 / x**2`.
- Condition number `kappa(A)` bounds how much input error is amplified; `np.linalg.cond(A)` near `1e16` means the solution has no reliable digits.

## Documentation checklist

- [ ] Formula and derivation sketch
- [ ] Order of accuracy and conditions for it
- [ ] Parameters, defaults, and failure behavior
- [ ] Runnable example with expected output
- [ ] Error table or plot showing convergence
- [ ] References to a textbook or paper

## Sources

- What Every Computer Scientist Should Know About Floating-Point Arithmetic: https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
- NumPy documentation: https://numpy.org/doc/stable/
- SciPy optimization, integration, and ODE guides: https://docs.scipy.org/doc/scipy/tutorial/index.html
- Python `math.isclose` and `math.fsum`: https://docs.python.org/3/library/math.html
