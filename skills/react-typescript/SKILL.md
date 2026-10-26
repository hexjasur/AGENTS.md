---
name: react-typescript
description: Write and review modern React 19+ with strict TypeScript, including component and hook design, state placement, derived state, effects, data fetching, forms and Actions, Suspense and error boundaries, performance, Tailwind styling, and accessible markup. Use when building or refactoring React components, hooks, forms, or state, fixing re-render, effect, or type errors, migrating older React code, or reviewing a React and TypeScript pull request.
license: MIT
metadata:
  author: hexjasur
  version: "1.0.0"
  last_reviewed: "2026-10-25"
---

# React and TypeScript

Prefer simple, pure components and let the type system and the framework do the work. Derive values instead of syncing them, and keep effects for talking to the outside world.

## Procedure

```text
- [ ] 1. Confirm React, TypeScript, bundler, and test tooling in the repo
- [ ] 2. Model the data and states with types first
- [ ] 3. Place state at the lowest level that needs it
- [ ] 4. Build components as pure functions of props and state
- [ ] 5. Use effects only to synchronize with external systems
- [ ] 6. Handle loading, error, and empty states; check accessibility
- [ ] 7. Run typecheck, lint, tests; profile before optimizing
```

1. Read `package.json`, `tsconfig.json`, and the lint config. Match the repo's conventions, router, data library, and styling approach instead of introducing new ones.
2. Use `strict` TypeScript. Model UI state with discriminated unions (`{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ready'; data: T }`), not several booleans. Validate data at runtime boundaries (API, storage, `JSON.parse`) with a schema library, then infer types from the schema.
3. Keep state local first. Lift it only when siblings need it, and prefer composition or context over prop drilling. Put server data in a data-fetching library or the framework's loaders, not in `useEffect` plus `useState`.
4. Components are named function components with typed props. Compute derived values during render. Do not copy props into state.
5. An effect is for subscriptions, timers, DOM APIs, and network sync. Always return a cleanup, list every dependency, and do not use effects to transform data or react to clicks.
6. Cover loading, error, empty, and success states. Use semantic elements, labels, and keyboard support (see `web-accessibility`). Wrap risky subtrees in error boundaries and slow ones in Suspense.
7. Keep shareable route state in the URL: pagination, filters, sorting, selected entities, and open media should survive refresh, direct links, and browser back/forward. Use the existing router APIs and validate query values; reserve local state for ephemeral UI such as an unsubmitted draft or hover.
8. Run `tsc --noEmit`, the linter, and tests. Measure with the React Profiler or browser tools before adding `memo`, `useMemo`, or `useCallback`; with the React Compiler enabled, manual memoization is rarely needed.

## Guardrails

- Never use `any`. Use `unknown` and narrow it, or precise generics. Avoid `as` casts and non-null `!` assertions that hide real `null` cases.
- Never suppress type or lint errors with `@ts-ignore` or blanket disables. Use `@ts-expect-error` with a reason only when unavoidable.
- Never mutate state or props. Create new objects and arrays.
- Never call hooks conditionally or inside loops, and never fetch data inside render.
- Never use array index as `key` for lists that can reorder, insert, or delete.
- Never build Tailwind class names dynamically (`bg-${color}-500`); map to full literal class names.
- Never use `dangerouslySetInnerHTML` with untrusted content without a reviewed sanitizer.
- Do not add a dependency for something React or the platform already provides.

## Gotchas

- Strict Mode runs effects twice in development to expose missing cleanup. Fix the cleanup; do not remove Strict Mode.
- Object, array, and function dependencies change every render. Move them out of the component, memoize them deliberately, or depend on primitive values.
- Stale closures in handlers and effects come from missing dependencies or from reading state after `await`. Use functional updates (`setCount(c => c + 1)`) when the next value depends on the previous one.
- `useEffect` that sets state from other state creates extra renders and bugs; compute the value in render instead.
- In React 19, `ref` is a regular prop on function components, `forwardRef` is no longer required, `defaultProps` for function components is removed (use default parameters), and `ReactDOM.render` is gone (`createRoot`).
- Prefer `<form action={fn}>` with `useActionState`, `useFormStatus`, and `useOptimistic` for mutations; read uncontrolled inputs through `FormData` instead of controlling every field.
- Use `useTransition` or `useDeferredValue` to keep input responsive during expensive updates; use virtualization for long lists.
- Context re-renders every consumer when its value changes. Split contexts by update frequency and memoize provider values.
- `fetch().json()` and `JSON.parse` return untyped data; validate before trusting it.
- Component-only pagination/filter state is lost on refresh and cannot be shared. Encode navigable state in path or query parameters and respond to `popstate` through the router, not a hand-rolled effect.
- Event types are specific: `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`. Use `React.ReactNode` for children.
- In a Tauri app, do not assume server rendering or a browser-only API is always present; guard desktop-only calls (see `tauri-best-practices`).

## Report format

For a review: group findings by correctness, types, state and effects, performance, accessibility, and style, ordered by severity, each with file, why it breaks, and the fix. State which checks (typecheck, lint, tests, manual) were run.

Read `references/react-ts-reference.md` for the `tsconfig`, component, form, data, and Tailwind patterns.
