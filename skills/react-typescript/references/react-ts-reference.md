# React and TypeScript reference

Load this after `SKILL.md` when writing configuration or implementing patterns. Adapt to the project's tooling.

## Strict `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

`noUncheckedIndexedAccess` makes `array[i]` possibly `undefined`, which catches real bugs. Add it to existing projects gradually.

## Async state as a discriminated union

```tsx
type Async<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready'; data: T };

function UserCard({ state }: { state: Async<User> }) {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return <Skeleton />;
    case 'error':
      return <p role="alert">{state.error.message}</p>;
    case 'ready':
      return <h2>{state.data.name}</h2>;
  }
}
```

TypeScript checks the `switch` is exhaustive when the function has a return type.

## Derive, do not sync

```tsx
// Bad: duplicated state kept in sync by an effect
const [filtered, setFiltered] = useState<Item[]>([]);
useEffect(() => setFiltered(items.filter(match)), [items, match]);

// Good: compute during render (memoize only if profiling shows a cost)
const filtered = items.filter(match);
```

## Effect with cleanup

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(`/api/items/${id}`, { signal: controller.signal })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then(setData)
    .catch((e) => {
      if (e.name !== 'AbortError') setError(e);
    });
  return () => controller.abort();
}, [id]);
```

Prefer a data library or router loader for real apps. Use this shape only for simple cases.

## Form with an Action (React 19)

```tsx
import { useActionState } from 'react';

type FormState = { error?: string; ok?: boolean };

async function save(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return { error: 'Name is required' };
  await api.save({ name });
  return { ok: true };
}

export function ProfileForm() {
  const [state, action, pending] = useActionState(save, {});
  return (
    <form action={action}>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" required aria-describedby="name-error" />
      {state.error && <p id="name-error" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
    </form>
  );
}
```

## Typed props and polymorphic wrappers

```tsx
type ButtonProps = React.ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  return <button className={cn(base, variants[variant], className)} {...rest} />;
}
```

`React.ComponentProps<'button'>` includes `ref` in React 19, so no `forwardRef` is needed.

## Tailwind helpers

```ts
// cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// Literal class names so Tailwind can detect them
const variants = {
  primary: 'bg-amber-500 text-black hover:bg-amber-400',
  ghost: 'bg-transparent text-amber-300 hover:bg-white/10',
} as const;
```

Tailwind v4 is configured in CSS (`@import "tailwindcss";` and `@theme { ... }`); see `ui-ux-design` for tokens.

## Lint and CI checks

```sh
tsc --noEmit
eslint . --max-warnings 0
vitest run
```

Enable `react-hooks` lint rules (rules of hooks and exhaustive dependencies) and keep them as errors.

## Sources

- [React documentation](https://react.dev/)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [React 19 release notes](https://react.dev/blog/2024/12/05/react-19)
- [React Compiler](https://react.dev/learn/react-compiler)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS](https://tailwindcss.com/docs)
