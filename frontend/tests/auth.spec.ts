import { test, expect, Page } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

/**
 * Authentication tests for LinoChat
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');
    
    // Check that login form is visible
    await expect(page.getByRole('heading', { name: /sign in|login|вход/i })).toBeVisible();
    await expect(page.getByLabel(/email|e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/password|пароль/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in|login|войти/i })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    
    // Click sign in without filling fields
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    
    // Check for validation messages
    await expect(page.locator('text=/required|обязательное/i')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.getByLabel(/email|e-mail/i).fill('invalid@example.com');
    await page.getByLabel(/password|пароль/i).fill('wrongpassword');
    
    // Click sign in
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    
    // Check for error message
    await expect(page.locator('text=/invalid|incorrect|неправильный|ошибка/i').first()).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    
    // Click sign in
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    
    // Wait for navigation to dashboard
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
    
    // Verify we're logged in by checking for dashboard elements
    await expect(page.locator('text=/dashboard|projects|проекты/i').first()).toBeVisible();
  });

  test('should remember email when "remember me" is checked', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in credentials
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    
    // Check remember me if checkbox exists
    const rememberMe = page.getByLabel(/remember|запомнить/i);
    if (await rememberMe.isVisible().catch(() => false)) {
      await rememberMe.check();
    }
    
    // Login
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    
    // Wait for navigation
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
    
    // Logout
    await page.getByRole('button', { name: /logout|sign out|выйти/i }).click();
    
    // Check if email is remembered
    await page.goto('/login');
    const emailField = page.getByLabel(/email|e-mail/i);
    const savedEmail = await emailField.inputValue();
    expect(savedEmail).toBe(TEST_EMAIL);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
    
    // Click logout
    await page.getByRole('button', { name: /logout|sign out|выйти/i }).click();
    
    // Verify redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: /sign in|login|вход/i })).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Should be redirected to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
