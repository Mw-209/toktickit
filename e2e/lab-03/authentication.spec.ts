import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const getScreenshotPath = (name: string) => `artifacts/lab-03/screenshots/auth_${name}.png`;

  test('E2E-AUTH-01: Valid login flow', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: getScreenshotPath('login_page') });
    
    // Fill in the login form with a known active requester
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Should redirect to my-tickets
    await expect(page.locator('#nav-my-tickets')).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('requester_home') });
    
    // Check role badge
    await expect(page.getByText('REQUESTER')).toBeVisible();
  });

  test('E2E-AUTH-02: Invalid login shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'alex.turner@example.edu');
    await page.fill('#password', 'WrongPassword!');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Invalid credentials or inactive account');
    await page.screenshot({ path: getScreenshotPath('login_error') });
  });

  test('E2E-AUTH-03: mustChangePassword user login flow', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();
    
    // 2. Create a new user (which sets mustChangePassword=true)
    const uniqueEmail = `testuser${Date.now()}@example.edu`;
    await page.click('text=+ Create User');
    await page.fill('#createForm input[type="text"]:not([minlength])', 'Test User');
    await page.fill('#createForm input[type="email"]', uniqueEmail);
    // Role is REQUESTER by default
    await page.fill('#createForm input[minlength="8"]', 'TempPass123!');
    await page.click('button[type="submit"][form="createForm"]');
    
    await expect(page.getByText('Create New User')).not.toBeVisible();
    
    // 3. Logout
    await page.click('text=Logout');

    // 4. Login as the new user
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'TempPass123!');
    await page.click('button[type="submit"]');

    // 5. Should redirect to Change Password (mustChangePassword flow)
    await expect(page.getByText('Set Your New Password')).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('change_password_page') });
  });

  test('E2E-AUTH-04: Logout clears session', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();

    // Click logout
    await page.click('text=Logout');

    // Should be back at login
    await expect(page.locator('#email')).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('after_logout') });
  });

  test('E2E-AUTH-05: Direct URL access after logout', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();
    
    // Logout
    await page.click('text=Logout');
    await expect(page.locator('#email')).toBeVisible();

    // Try to reload
    await page.reload();
    await expect(page.locator('#email')).toBeVisible();
  });
});
