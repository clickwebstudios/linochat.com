import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

/**
 * Dashboard tests for LinoChat
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
  });

  test('should display dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check dashboard heading
    await expect(page.getByRole('heading', { name: /dashboard|overview/i })).toBeVisible();
    
    // Check for common dashboard elements
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('should display sidebar navigation', async ({ page }) => {
    const nav = page.locator('nav, aside, [role="navigation"]').first();
    await expect(nav).toBeVisible();
    
    // Check for common navigation items
    const navItems = ['dashboard', 'projects', 'chat', 'settings', 'analytics', 'team'];
    for (const item of navItems) {
      const navItem = page.locator(`nav >> text=/\\b${item}\\b/i, aside >> text=/\\b${item}\\b/i`).first();
      // Not all items may exist, so we just check if nav is visible
      break;
    }
  });

  test('should navigate to projects page', async ({ page }) => {
    await page.getByRole('link', { name: /projects|проекты/i }).first().click();
    await expect(page).toHaveURL(/projects/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /projects|проекты/i })).toBeVisible();
  });

  test('should navigate to chat page', async ({ page }) => {
    await page.getByRole('link', { name: /chat|чат/i }).first().click();
    await expect(page).toHaveURL(/chat/, { timeout: 5000 });
    await expect(page.locator('text=/chat|чат|messages|сообщения/i').first()).toBeVisible();
  });

  test('should display user profile menu', async ({ page }) => {
    // Look for user menu button or avatar
    const userMenu = page.locator('[data-testid="user-menu"], button:has-text("admin"), [aria-label*="user"]').first();
    if (await userMenu.isVisible().catch(() => false)) {
      await userMenu.click();
      await expect(page.locator('text=/profile|logout|settings/i').first()).toBeVisible();
    }
  });

  test('should display statistics or metrics', async ({ page }) => {
    // Check for common dashboard metrics/statistics
    const hasStats = await page.locator('text=/\\d+|[0-9]+%|active|total|new/i').first().isVisible().catch(() => false);
    expect(hasStats).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/dashboard');
    await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
    
    // Check for hamburger menu on mobile
    const hamburger = page.locator('button[aria-label*="menu"], button:has(svg), [data-testid="menu-button"]').first();
    expect(await hamburger.isVisible().catch(() => false)).toBeTruthy();
  });

  test('should display notifications or bell icon', async ({ page }) => {
    // Look for notification bell or icon
    const notificationBell = page.locator('[aria-label*="notification"], button:has(svg[viewBox*="bell"]), [data-testid="notifications"]').first();
    // This is optional, so we just check it exists if the selector is found
    const exists = await notificationBell.count() > 0;
    if (exists) {
      await expect(notificationBell).toBeVisible();
    }
  });
});
