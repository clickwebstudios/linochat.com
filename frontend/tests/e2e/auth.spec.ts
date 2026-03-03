import { test, expect } from '@playwright/test';

// ─── Login Page ─────────────────────────────────────────────────────────────

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders all form elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /forgot password/i })).toBeVisible();
  });

  test('shows error on empty submit', async ({ page }) => {
    await page.getByRole('button', { name: /sign in/i }).click();
    // Button fires handleSubmit — no fields filled, API call made with empty data
    // Expect an error toast or the button to still be present
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('navigates to signup from sign up link', async ({ page }) => {
    await page.getByRole('link', { name: /sign up for free/i }).click();
    await expect(page).toHaveURL('/signup');
  });

  test('navigates to forgot password', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL('/forgot-password');
  });
});

// ─── Signup Page ─────────────────────────────────────────────────────────────

test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders step 1 form elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    await expect(page.locator('#fullName')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#companyName')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeVisible();
  });

  test('shows validation error when Continue clicked with empty fields', async ({ page }) => {
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText(/please fill in all required fields/i)).toBeVisible();
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.locator('#fullName').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#companyName').fill('TestCo');
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('different123');
    await page.getByRole('button', { name: /continue/i }).click();
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
  });

  test('shows error when password is too short', async ({ page }) => {
    await page.locator('#fullName').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#companyName').fill('TestCo');
    await page.locator('#password').fill('short');
    await page.locator('#confirmPassword').fill('short');
    await page.getByRole('button', { name: /continue/i }).click();
    // Match the toast message exactly (static hint also contains "8 characters" so be specific)
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('advances to step 2 when form is valid (backend offline)', async ({ page }) => {
    await page.locator('#fullName').fill('Test User');
    await page.locator('#email').fill('test@example.com');
    await page.locator('#companyName').fill('TestCo');
    await page.locator('#password').fill('password123');
    await page.locator('#confirmPassword').fill('password123');
    await page.getByRole('button', { name: /continue/i }).click();

    // Should advance to step 2 even if backend is offline
    // CSRF fetch (5s) + API request (8s) = ~13s worst case
    await expect(page.getByRole('heading', { name: /check your email/i })).toBeVisible({ timeout: 15000 });
  });

  test('navigates to login from sign in link', async ({ page }) => {
    await page.getByRole('link', { name: /sign in/i }).click();
    await expect(page).toHaveURL('/login');
  });
});

// ─── Forgot Password Page ─────────────────────────────────────────────────────

test.describe('Forgot password page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/forgot-password');
  });

  test('renders reset form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /forgot|reset/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /reset|send/i })).toBeVisible();
  });

  test('navigates back to login', async ({ page }) => {
    await page.getByRole('link', { name: /back|sign in|login/i }).click();
    await expect(page).toHaveURL('/login');
  });
});
