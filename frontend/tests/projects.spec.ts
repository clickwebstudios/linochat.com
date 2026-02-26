import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

/**
 * Projects tests for LinoChat
 */

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
    
    // Navigate to projects page
    await page.goto('/projects');
    await expect(page.getByRole('heading', { name: /projects|проекты/i })).toBeVisible();
  });

  test('should display projects list', async ({ page }) => {
    // Check that projects page loads
    await expect(page.locator('text=/projects|проекты/i').first()).toBeVisible();
    
    // Check for projects list or empty state
    const hasProjects = await page.locator('[data-testid="project-item"], .project-card, tr:has(td)').first().isVisible().catch(() => false);
    const hasEmptyState = await page.locator('text=/no projects|empty|пусто|нет проектов/i').first().isVisible().catch(() => false);
    
    expect(hasProjects || hasEmptyState).toBeTruthy();
  });

  test('should open create project modal or page', async ({ page }) => {
    // Click create project button
    const createButton = page.getByRole('button', { name: /create project|new project|создать проект|новый проект/i });
    await expect(createButton).toBeVisible();
    await createButton.click();
    
    // Check if modal or page opened
    await expect(page.locator('text=/create project|new project|создать проект|project name/i').first()).toBeVisible();
  });

  test('should validate project creation form', async ({ page }) => {
    // Open create project
    await page.getByRole('button', { name: /create project|new project|создать проект/i }).click();
    
    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /create|save|создать|сохранить/i }).last();
    await submitButton.click();
    
    // Check for validation error
    await expect(page.locator('text=/required|обязательное|error|ошибка/i').first()).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;
    
    // Open create project
    await page.getByRole('button', { name: /create project|new project|создать проект/i }).click();
    
    // Fill project name
    await page.getByLabel(/name|название/i).fill(projectName);
    
    // Fill description if field exists
    const descriptionField = page.getByLabel(/description|описание/i);
    if (await descriptionField.isVisible().catch(() => false)) {
      await descriptionField.fill('This is a test project created by Playwright');
    }
    
    // Submit form
    await page.getByRole('button', { name: /create|save|создать|сохранить/i }).last().click();
    
    // Wait for project to appear in list
    await expect(page.locator(`text=${projectName}`).first()).toBeVisible({ timeout: 10000 });
  });

  test('should search for projects', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search|поиск/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      
      // Wait for search results
      await page.waitForTimeout(500);
      
      // Check that results are displayed
      await expect(page.locator('[data-testid="project-item"], .project-card, tr').first()).toBeVisible();
    }
  });

  test('should open project details', async ({ page }) => {
    // Click on first project if exists
    const firstProject = page.locator('[data-testid="project-item"], .project-card, tr:has(td) a').first();
    if (await firstProject.isVisible().catch(() => false)) {
      await firstProject.click();
      
      // Check that project details page loaded
      await expect(page.locator('text=/project details|settings|overview/i').first()).toBeVisible();
    }
  });

  test('should edit project', async ({ page }) => {
    // Open first project
    const firstProject = page.locator('[data-testid="project-item"], .project-card, tr:has(td)').first();
    if (await firstProject.isVisible().catch(() => false)) {
      await firstProject.click();
      
      // Look for edit button
      const editButton = page.getByRole('button', { name: /edit|настройки|settings/i }).first();
      if (await editButton.isVisible().catch(() => false)) {
        await editButton.click();
        
        // Edit project name
        const newName = `Updated Project ${Date.now()}`;
        const nameField = page.getByLabel(/name|название/i).first();
        await nameField.clear();
        await nameField.fill(newName);
        
        // Save changes
        await page.getByRole('button', { name: /save|update|сохранить/i }).click();
        
        // Verify update
        await expect(page.locator(`text=${newName}`).first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should delete project', async ({ page }) => {
    // Create a project to delete
    const projectName = `Delete Test ${Date.now()}`;
    
    await page.getByRole('button', { name: /create project|new project|создать проект/i }).click();
    await page.getByLabel(/name|название/i).fill(projectName);
    await page.getByRole('button', { name: /create|save|создать|сохранить/i }).last().click();
    await expect(page.locator(`text=${projectName}`).first()).toBeVisible({ timeout: 10000 });
    
    // Find delete button for the project
    const deleteButton = page.locator(`text=${projectName}`).locator('..').locator('button[aria-label*="delete"], button:has-text("delete"), [data-testid="delete-project"]').first();
    
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();
      
      // Confirm deletion
      await page.getByRole('button', { name: /confirm|yes|delete|удалить/i }).click();
      
      // Verify project is removed
      await expect(page.locator(`text=${projectName}`)).not.toBeVisible({ timeout: 5000 });
    }
  });
});
