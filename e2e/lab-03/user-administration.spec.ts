import { test, expect } from '@playwright/test';

test.describe('User Administration', () => {
  const getScreenshotPath = (name: string) => `artifacts/lab-03/screenshots/admin_${name}.png`;

  test.beforeEach(async ({ page }) => {
    // Log in as Administrator
    await page.goto('/');
    await page.fill('#email', 'admin@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('h2:has-text("Administrator User Management")')).toBeVisible();
  });

  test('E2E-ADMIN-01: Admin login → User Management loads', async ({ page }) => {
    await page.screenshot({ path: getScreenshotPath('admin_management_loaded') });
    
    // Check if table rows exist
    const rows = page.locator('table.zen-table tbody tr');
    await expect(rows.first()).toBeVisible();
    
    // Check if Admin User exists in the table
    await expect(page.getByText('admin@example.edu')).toBeVisible();
  });

  test('E2E-ADMIN-02: Create new IT Staff user', async ({ page }) => {
    const uniqueEmail = `new.itstaff${Date.now()}@example.edu`;
    
    await page.click('text=+ Create User');
    await expect(page.getByText('Create New User')).toBeVisible();
    
    await page.fill('#createForm input[type="text"]:not([minlength])', 'New IT Staff');
    await page.fill('#createForm input[type="email"]', uniqueEmail);
    await page.selectOption('#createForm select.zen-select', 'IT_STAFF');
    await page.fill('#createForm input[minlength="8"]', 'Password123!');
    
    await page.screenshot({ path: getScreenshotPath('admin_create_user_modal') });
    await page.click('button[type="submit"][form="createForm"]');
    
    // Modal should close and user should appear in the table
    await expect(page.getByText('Create New User')).not.toBeVisible();
    await page.fill('input[placeholder="Search by name or email..."]', uniqueEmail);
    await page.click('button:has-text("Search")');
    
    await expect(page.getByText(uniqueEmail)).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('admin_user_created') });
  });

  test('E2E-ADMIN-03: Create user with duplicate email', async ({ page }) => {
    await page.click('text=+ Create User');
    
    await page.fill('#createForm input[type="text"]:not([minlength])', 'Duplicate User');
    await page.fill('#createForm input[type="email"]', 'admin@example.edu'); // Already exists
    await page.selectOption('#createForm select.zen-select', 'REQUESTER');
    await page.fill('#createForm input[minlength="8"]', 'Password123!');
    
    await page.click('button[type="submit"][form="createForm"]');
    
    // Should show conflict error
    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Email already in use'); 
    
    await page.screenshot({ path: getScreenshotPath('admin_duplicate_email_error') });
    
    // Close modal to reset state
    await page.click('button:has-text("Cancel")');
  });

  test('E2E-ADMIN-04: Edit user name and save', async ({ page }) => {
    // Find an existing user, for example Bob Technician
    await page.fill('input[placeholder="Search by name or email..."]', 'bob.tech');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Edit")');
    await expect(page.getByText('Edit User')).toBeVisible();
    
    // Change name
    const newName = `Bob Technician ${Date.now()}`;
    await page.fill('#editForm input[type="text"]:not([minlength])', newName);
    
    await page.screenshot({ path: getScreenshotPath('admin_edit_user_modal') });
    await page.click('button[type="submit"]:has-text("Save Changes")');
    
    await expect(page.getByText('Edit User')).not.toBeVisible();
    await page.waitForTimeout(500); // Wait for list to update
    await expect(page.getByText(newName)).toBeVisible();
    
    await page.screenshot({ path: getScreenshotPath('admin_user_edited') });
  });

  test('E2E-ADMIN-05: Admin tries to deactivate own account', async ({ page }) => {
    // Search for admin
    await page.fill('input[placeholder="Search by name or email..."]', 'admin@example.edu');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Edit")');
    
    // Attempt to set status to Inactive
    // Assuming status select is the second select in the modal (Role, then Status)
    const selects = page.locator('#editForm select.zen-select');
    await selects.nth(1).selectOption({ label: 'Inactive' }); 
    
    await page.click('button[type="submit"][form="editForm"]');
    
    // Should show error
    const errorMsg = page.locator('.zen-alert-error');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toContainText('Cannot deactivate your own account'); // Adjust text if it differs
    
    await page.screenshot({ path: getScreenshotPath('admin_deactivate_self_error') });
  });
});
