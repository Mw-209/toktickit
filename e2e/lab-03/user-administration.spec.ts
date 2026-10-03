import { test, expect } from '@playwright/test';

test.describe('User Administration', () => {
  const shot = (name: string) =>
    `artifacts/lab-03/screenshots/user-management/${test.info().project.name}-${name}.png`;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();
  });

  test('E2E-ADMIN-01: User list page', async ({ page }) => {
    await page.screenshot({ path: shot('list') });
    const rows = page.locator('table.zen-table tbody tr');
    await expect(rows.first()).toBeVisible();
    await expect(page.getByText('admin@example.edu')).toBeVisible();
  });

  test('E2E-ADMIN-02: Create user dialog', async ({ page }) => {
    await page.click('text=+ Create User');
    await expect(page.getByText('Create New User')).toBeVisible();
    await page.screenshot({ path: shot('create-dialog') });
    await page.click('button:has-text("Cancel")');
  });

  test('E2E-ADMIN-03: Create user validation (empty submit)', async ({ page }) => {
    await page.click('text=+ Create User');
    await expect(page.getByText('Create New User')).toBeVisible();
    await page.click('button[type="submit"][form="createForm"]');
    await page.screenshot({ path: shot('create-validation') });
    await page.click('button:has-text("Cancel")');
  });

  test('E2E-ADMIN-04: Create new IT Staff user successfully', async ({ page }) => {
    const uniqueEmail = `new.itstaff${Date.now()}@example.edu`;
    await page.click('text=+ Create User');
    await page.fill('#createForm input[type="text"]:not([minlength])', 'New IT Staff');
    await page.fill('#createForm input[type="email"]', uniqueEmail);
    await page.selectOption('#createForm select.zen-select', 'IT_STAFF');
    await page.fill('#createForm input[minlength="8"]', 'Password123!');
    await page.click('button[type="submit"][form="createForm"]');
    await expect(page.getByText('Create New User')).not.toBeVisible();
    await page.fill('input[placeholder="Search by name or email..."]', uniqueEmail);
    await page.click('button:has-text("Search")');
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await page.screenshot({ path: shot('list') });
  });

  test('E2E-ADMIN-05: Edit user dialog', async ({ page }) => {
    await page.click('button:has-text("Edit")');
    await expect(page.getByText('Edit User')).toBeVisible();
    await page.screenshot({ path: shot('edit-dialog') });
    await page.click('button:has-text("Cancel")');
  });

  test('E2E-ADMIN-06: Set password dialog (create flow)', async ({ page }) => {
    await page.click('text=+ Create User');
    await expect(page.getByText('Create New User')).toBeVisible();
    // Fill minimum fields to show password field active
    await page.fill('#createForm input[type="text"]:not([minlength])', 'Test Set Pass');
    await page.fill('#createForm input[type="email"]', `setpass${Date.now()}@example.edu`);
    await page.screenshot({ path: shot('set-password-dialog') });
    await page.click('button:has-text("Cancel")');
  });

  test('E2E-ADMIN-07: Admin tries to deactivate own account', async ({ page }) => {
    await page.fill('input[placeholder="Search by name or email..."]', 'admin@example.edu');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Edit")');

    const selects = page.locator('#editForm select.zen-select');
    await selects.nth(1).selectOption({ label: 'Inactive' });
    await page.click('button[type="submit"][form="editForm"]');

    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Cannot deactivate your own account');
    await page.screenshot({ path: shot('list') });
  });
});
