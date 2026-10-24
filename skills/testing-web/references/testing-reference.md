# Testing reference

Load this after `SKILL.md` when configuring tools or writing tests. Adjust paths and package manager to the project.

## Vitest setup (component tests)

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    clearMocks: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` fails tests that make unexpected network calls.

## MSW handlers

```ts
// src/test/server.ts
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

export const server = setupServer(
  http.get('/api/profile', () => HttpResponse.json({ name: 'Ada' })),
);
```

Override per test with `server.use(http.get('/api/profile', () => new HttpResponse(null, { status: 500 })))` to test failures.

## Component test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileForm } from './ProfileForm';

test('shows an error when the name is empty, then saves', async () => {
  const user = userEvent.setup();
  render(<ProfileForm />);

  await user.click(screen.getByRole('button', { name: /save/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/name is required/i);

  await user.type(screen.getByLabelText(/name/i), 'Ada');
  await user.click(screen.getByRole('button', { name: /save/i }));
  expect(await screen.findByText(/saved/i)).toBeVisible();
});
```

## Tauri IPC mock

```ts
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { afterEach } from 'vitest';

afterEach(() => clearMocks());

test('loads notes from the backend', async () => {
  mockIPC((cmd, args) => {
    if (cmd === 'read_notes') return `notes for ${(args as { name: string }).name}`;
  });
  // render the component and assert the visible result
});
```

## Playwright config

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Playwright test with an accessibility check

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page loads and has no obvious a11y violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

## CI snippet

```yaml
- run: npm ci
- run: npx tsc --noEmit
- run: npx vitest run --coverage
- run: npx playwright install --with-deps chromium
- run: npx playwright test
- if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 7
```

Pin actions to full commit SHAs (see `github-actions`).

## Flaky test triage

1. Reproduce: `npx playwright test --repeat-each=20 path/to/test` or `vitest run --retry=0` in a loop.
2. Read the trace or the first failing assertion; look for races, shared state, time, and network.
3. Replace sleeps with web-first assertions; isolate data per test; control time and network.
4. If it cannot be fixed now, mark it with a linked issue and report it. Do not silently retry or skip.

## Sources

- [Vitest](https://vitest.dev/)
- [Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/)
- [Playwright best practices](https://playwright.dev/docs/best-practices)
- [Mock Service Worker](https://mswjs.io/docs/)
- [Tauri mocking](https://v2.tauri.app/develop/tests/mocking/)
