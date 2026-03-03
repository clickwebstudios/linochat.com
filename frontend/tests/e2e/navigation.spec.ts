import { test, expect } from '@playwright/test';

// ─── Public Routes ─────────────────────────────────────────────────────────────

test.describe('Public navigation', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/LinoChat/i);
    await expect(page.getByRole('link', { name: /LinoChat/i }).first()).toBeVisible();
  });

  test('marketing pages are accessible', async ({ page }) => {
    for (const path of ['/features', '/pricing', '/about', '/contact']) {
      await page.goto(path);
      await expect(page).toHaveURL(path);
      // Should not redirect to login
      await expect(page).not.toHaveURL('/login');
    }
  });

  test('help center loads', async ({ page }) => {
    await page.goto('/help');
    await expect(page).not.toHaveURL('/login');
  });
});

// ─── Protected Routes ─────────────────────────────────────────────────────────

test.describe('Protected route redirects', () => {
  const protectedRoutes = [
    '/agent/dashboard',
    '/admin/dashboard',
    '/superadmin/dashboard',
    '/agent/chats',
    '/admin/tickets',
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to /login when unauthenticated`, async ({ page }) => {
      await page.goto(route);
      // Wait up to 15s: PrivateRoute fetches /api/auth/me (8s axios timeout) before redirecting
      await page.waitForURL('/login', { timeout: 15000 });
      await expect(page).toHaveURL('/login');
    });
  }
});

// ─── 404 / unknown routes ─────────────────────────────────────────────────────

test.describe('Unknown routes', () => {
  test('unknown path does not crash the app', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    // App should render something (not blank/crash)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
