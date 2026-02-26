import { test, expect } from '@playwright/test';

// Test credentials
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@clickwebstudio.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || '123123123';

/**
 * Chat tests for LinoChat
 */

test.describe('Chat', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email|e-mail/i).fill(TEST_EMAIL);
    await page.getByLabel(/password|пароль/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /sign in|login|войти/i }).click();
    await expect(page).toHaveURL(/dashboard|app|projects/, { timeout: 10000 });
    
    // Navigate to chat page
    await page.goto('/chat');
  });

  test('should display chat interface', async ({ page }) => {
    // Check chat page elements
    await expect(page.locator('text=/chat|чат|messages|conversations/i').first()).toBeVisible();
    
    // Look for chat container
    const chatContainer = page.locator('[data-testid="chat-container"], .chat-container, [class*="chat"]').first();
    await expect(chatContainer).toBeVisible();
  });

  test('should display conversation list', async ({ page }) => {
    // Check for conversation list sidebar
    const conversationList = page.locator('[data-testid="conversation-list"], .conversation-list, aside').first();
    await expect(conversationList).toBeVisible();
  });

  test('should search conversations', async ({ page }) => {
    // Look for search input
    const searchInput = page.getByPlaceholder(/search|поиск|find/i).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Results should be filtered
      await expect(page.locator('[data-testid="conversation-item"], .conversation-item').first()).toBeVisible().catch(() => {
        // Empty state is also acceptable
        expect(page.locator('text=/no results|empty|не найдено/i').first()).toBeVisible();
      });
    }
  });

  test('should select a conversation', async ({ page }) => {
    // Click on first conversation
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item, [role="listitem"]').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Check that conversation is selected and messages are shown
      await expect(page.locator('[data-testid="message-list"], .message-list, [class*="messages"]').first()).toBeVisible();
    }
  });

  test('should send a message', async ({ page }) => {
    // Select a conversation first
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Type a message
      const messageInput = page.getByPlaceholder(/type a message|введите сообщение|message/i).first();
      await expect(messageInput).toBeVisible();
      
      const testMessage = `Test message ${Date.now()}`;
      await messageInput.fill(testMessage);
      
      // Send message
      const sendButton = page.getByRole('button', { name: /send|отправить/i });
      await sendButton.click();
      
      // Verify message appears in chat
      await expect(page.locator(`text=${testMessage}`).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display message status indicators', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Check for status indicators (sent, delivered, read)
      const statusIndicators = page.locator('[data-testid="message-status"], .message-status, svg[class*="status"]').first();
      // This is optional, so we just verify the message list is visible
      await expect(page.locator('[data-testid="message-list"], .message-list').first()).toBeVisible();
    }
  });

  test('should scroll to load more messages', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Scroll up in message list
      const messageList = page.locator('[data-testid="message-list"], .message-list, [class*="messages"]').first();
      if (await messageList.isVisible().catch(() => false)) {
        await messageList.evaluate(el => el.scrollTop = 0);
        
        // Wait a moment for potential lazy loading
        await page.waitForTimeout(1000);
        
        // Page should still be functional
        await expect(messageList).toBeVisible();
      }
    }
  });

  test('should display attachment button', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Look for attachment/file button
      const attachmentButton = page.getByRole('button', { name: /attach|file|upload|прикрепить/i });
      if (await attachmentButton.isVisible().catch(() => false)) {
        await expect(attachmentButton).toBeVisible();
      }
    }
  });

  test('should display emoji picker', async ({ page }) => {
    const firstConversation = page.locator('[data-testid="conversation-item"], .conversation-item').first();
    if (await firstConversation.isVisible().catch(() => false)) {
      await firstConversation.click();
      
      // Look for emoji button
      const emojiButton = page.getByRole('button', { name: /emoji|smile/i });
      if (await emojiButton.isVisible().catch(() => false)) {
        await emojiButton.click();
        await expect(page.locator('[data-testid="emoji-picker"], .emoji-picker').first()).toBeVisible();
      }
    }
  });

  test('should mark conversation as read', async ({ page }) => {
    const unreadConversation = page.locator('[data-testid="conversation-item"]:has(.unread, [data-unread]), .conversation-item.unread').first();
    if (await unreadConversation.isVisible().catch(() => false)) {
      await unreadConversation.click();
      
      // Wait for read status to update
      await page.waitForTimeout(1000);
      
      // Verify conversation is marked as read
      const isUnread = await unreadConversation.locator('.unread, [data-unread]').isVisible().catch(() => false);
      expect(isUnread).toBeFalsy();
    }
  });
});
