import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  const shot = (name: string) =>
    `artifacts/lab-03/screenshots/authentication/${test.info().project.name}-${name}.png`;

  test('E2E-AUTH-01: Login page screenshot', async ({ page }) => {
    await page.goto('/');
    await page.screenshot({ path: shot('login') });
  });

  test('E2E-AUTH-02: Valid login flow', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('#nav-my-tickets')).toBeVisible();
    await expect(page.getByText('REQUESTER')).toBeVisible();
  });

  test('E2E-AUTH-03: Invalid credentials shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'WrongPassword!');
    await page.click('button[type="submit"]');
    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await page.screenshot({ path: shot('login-invalid') });
  });

  test('E2E-AUTH-04: Inactive user shows error', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'alex.turner@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await page.screenshot({ path: shot('login-inactive') });
  });

  test('E2E-AUTH-05: Login validation (empty fields)', async ({ page }) => {
    await page.goto('/');
    await page.click('button[type="submit"]');
    await page.screenshot({ path: shot('login-validation') });
  });

  test('E2E-AUTH-06: mustChangePassword → change password page', async ({ page }) => {
    // Login as Admin and create a new user
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();

    const uniqueEmail = `testauth${Date.now()}@example.edu`;
    await page.click('text=+ Create User');
    await page.fill('#createForm input[type="text"]:not([minlength])', 'Test Auth User');
    await page.fill('#createForm input[type="email"]', uniqueEmail);
    await page.fill('#createForm input[minlength="8"]', 'TempPass123!');
    await page.click('button[type="submit"][form="createForm"]');
    await expect(page.getByText('Create New User')).not.toBeVisible();

    // Logout and login as new user
    await page.click('text=Logout');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'TempPass123!');
    await page.click('button[type="submit"]');

    await expect(page.getByText('Set Your New Password')).toBeVisible();
    await page.screenshot({ path: shot('change-password') });
  });

  test('E2E-AUTH-07: Change password validation', async ({ page }) => {
    // Create user and go to change password page
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();

    const uniqueEmail = `testval${Date.now()}@example.edu`;
    await page.click('text=+ Create User');
    await page.fill('#createForm input[type="text"]:not([minlength])', 'Test Val User');
    await page.fill('#createForm input[type="email"]', uniqueEmail);
    await page.fill('#createForm input[minlength="8"]', 'TempPass123!');
    await page.click('button[type="submit"][form="createForm"]');
    await expect(page.getByText('Create New User')).not.toBeVisible();

    await page.click('text=Logout');
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', 'TempPass123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText('Set Your New Password')).toBeVisible();

    // Submit mismatched passwords
    await page.locator('input[type="password"]').first().fill('NewPass123!');
    await page.locator('input[type="password"]').last().fill('DifferentPass!');
    await page.click('button[type="submit"]');
    await page.screenshot({ path: shot('change-password-validation') });
  });

  test('E2E-AUTH-08: Logout clears session', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();
    await page.click('text=Logout');
    await expect(page.locator('#email')).toBeVisible();
  });
});
