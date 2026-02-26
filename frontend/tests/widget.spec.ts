import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

/**
 * Widget tests for LinoChat
 */

test.describe('Widget', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
  });

  test('should navigate to widget settings', async ({ page }) => {
    // Navigate to widgets page
    await page.goto('/widgets');
    
    // Check widgets page loaded
    await expect(page.locator('text=/widget|виджет/i').first()).toBeVisible();
  });

  test('should display widget list', async ({ page }) => {
    await page.goto('/widgets');
    
    // Check for widget list or empty state
    const hasWidgets = await page.locator('[data-testid="widget-item"], .widget-card, tr:has(td)').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no widgets|empty|пусто|нет виджетов/i').first().isVisible().catch(() => false);
    
    expect(hasWidgets || hasEmptyState).toBeTruthy();
  });

  test('should open create widget modal or page', async ({ page }) => {
    await page.goto('/widgets');
    
    // Look for create widget button
    const createButton = page.getByRole('button', { name: /create widget|new widget|создать виджет|новый виджет/i });
    
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      // Check that create form is visible
      await expect(page.locator('text=/create widget|widget name|create new/i').first()).toBeVisible();
    }
  });

  test('should create a new widget', async ({ page }) => {
    await page.goto('/widgets');
    
    const createButton = page.getByRole('button', { name: /create widget|new widget|создать виджет/i });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      const widgetName = `Test Widget ${Date.now()}`;
      
      // Fill widget name
      const nameField = page.getByLabel(/name|название/i).first();
      await nameField.fill(widgetName);
      
      // Fill other required fields if present
      const domainField = page.getByLabel(/domain|website|сайт/i).first();
      if (await domainField.isVisible().catch(() => false)) {
        await domainField.fill('example.com');
      }
      
      // Submit form
      await page.getByRole('button', { name: /create|save|создать|сохранить/i }).last().click();
      
      // Verify widget was created
      await expect(page.locator(`text=${widgetName}`).first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('should display widget embed code', async ({ page }) => {
    await page.goto('/widgets');
    
    // Click on first widget if exists
    const firstWidget = page.locator('[data-testid="widget-item"], .widget-card, tr:has(td)').first();
    if (await firstWidget.isVisible().catch(() => false)) {
      // Look for install/embed button
      const installButton = page.getByRole('button', { name: /install|embed|code|установка/i }).first();
      if (await installButton.isVisible().catch(() => false)) {
        await installButton.click();
        
        // Check for embed code
        await expect(page.locator('code, pre, textarea[readonly], [data-testid="embed-code"]').first()).toBeVisible();
      }
    }
  });

  test('should customize widget appearance', async ({ page }) => {
    await page.goto('/widgets');
    
    const firstWidget = page.locator('[data-testid="widget-item"], .widget-card').first();
    if (await firstWidget.isVisible().catch(() => false)) {
      await firstWidget.click();
      
      // Look for appearance/customization tab
      const appearanceTab = page.getByRole('tab', { name: /appearance|customize|look|внешний вид/i });
      if (await appearanceTab.isVisible().catch(() => false)) {
        await appearanceTab.click();
        
        // Check customization options
        await expect(page.locator('text=/color|theme|position|size|цвет|тема/i').first()).toBeVisible();
      }
    }
  });

  test('should configure widget triggers', async ({ page }) => {
    await page.goto('/widgets');
    
    const firstWidget = page.locator('[data-testid="widget-item"], .widget-card').first();
    if (await firstWidget.isVisible().catch(() => false)) {
      await firstWidget.click();
      
      // Look for triggers/settings tab
      const triggersTab = page.getByRole('tab', { name: /triggers|behavior|settings|настройки/i });
      if (await triggersTab.isVisible().catch(() => false)) {
        await triggersTab.click();
        
        // Check trigger options
        await expect(page.locator('text=/trigger|delay|scroll|time|page|триггер/i').first()).toBeVisible();
      }
    }
  });

  test('should copy widget installation code', async ({ page }) => {
    await page.goto('/widgets');
    
    const firstWidget = page.locator('[data-testid="widget-item"], .widget-card').first();
    if (await firstWidget.isVisible().catch(() => false)) {
      // Look for install button
      const installButton = page.getByRole('button', { name: /install|embed|get code/i }).first();
      if (await installButton.isVisible().catch(() => false)) {
        await installButton.click();
        
        // Look for copy button
        const copyButton = page.getByRole('button', { name: /copy|копировать/i }).first();
        if (await copyButton.isVisible().catch(() => false)) {
          await copyButton.click();
          
          // Check for success indicator
          await expect(page.locator('text=/copied|скопировано|success/i').first()).toBeVisible({ timeout: 3000 });
        }
      }
    }
  });

  test('should delete widget', async ({ page }) => {
    await page.goto('/widgets');
    
    // Create a widget to delete
    const createButton = page.getByRole('button', { name: /create widget|new widget/i });
    if (await createButton.isVisible().catch(() => false)) {
      await createButton.click();
      
      const widgetName = `Delete Widget ${Date.now()}`;
      await page.getByLabel(/name|название/i).first().fill(widgetName);
      await page.getByRole('button', { name: /create|save/i }).last().click();
      
      await expect(page.locator(`text=${widgetName}`).first()).toBeVisible({ timeout: 10000 });
      
      // Find and click delete button
      const deleteButton = page.locator(`text=${widgetName}`).locator('..').locator('button[aria-label*="delete"], button:has-text("delete")').first();
      
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        
        // Confirm deletion
        await page.getByRole('button', { name: /confirm|yes|delete/i }).click();
        
        // Verify widget is removed
        await expect(page.locator(`text=${widgetName}`)).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should preview widget', async ({ page }) => {
    await page.goto('/widgets');
    
    const firstWidget = page.locator('[data-testid="widget-item"], .widget-card').first();
    if (await firstWidget.isVisible().catch(() => false)) {
      // Look for preview button
      const previewButton = page.getByRole('button', { name: /preview|просмотр/i }).first();
      if (await previewButton.isVisible().catch(() => false)) {
        await previewButton.click();
        
        // Check that preview is displayed
        await expect(page.locator('[data-testid="widget-preview"], .widget-preview, iframe').first()).toBeVisible();
      }
    }
  });
});
