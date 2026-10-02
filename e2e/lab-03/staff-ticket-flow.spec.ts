import { test, expect } from '@playwright/test';

test.describe('IT Staff Ticket Flow', () => {
  const getScreenshotPath = (name: string) => `artifacts/lab-03/screenshots/staff_${name}.png`;

  test.beforeEach(async ({ page }) => {
    // Log in as IT Staff before each test
    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for queue to load
    await expect(page.getByText('IT Staff Ticket Queue')).toBeVisible();
  });

  test('E2E-STAFF-01: IT Staff login → Queue loads tickets', async ({ page }) => {
    await page.screenshot({ path: getScreenshotPath('queue_loaded') });
    
    // Check if table rows exist
    const rows = page.locator('table.zen-table tbody tr');
    await expect(rows.first()).toBeVisible();
  });

  test('E2E-STAFF-02: Search filters queue results', async ({ page }) => {
    // There is a seeded ticket with "Laptop battery drains quickly"
    await page.fill('input[placeholder="Search ticket number or summary…"]', 'battery');
    
    // Wait for the filter to apply (it might be debounced or immediate)
    await page.waitForTimeout(500); 
    
    const rows = page.locator('table.zen-table tbody tr');
    const firstRowText = await rows.first().textContent();
    expect(firstRowText?.toLowerCase()).toContain('battery');
    
    await page.screenshot({ path: getScreenshotPath('queue_search') });
  });

  test('E2E-STAFF-03: Open ticket detail from queue', async ({ page }) => {
    // Click on the first "View" button
    await page.locator('text=View').first().click();
    
    // Attachments section should exist
    await expect(page.locator('h3:has-text("Attachments")')).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('staff_ticket_detail') });
  });

  test('E2E-STAFF-04: Claim ticket + update status', async ({ page }) => {
    // Find an unassigned ticket (maybe "Cannot connect to campus VPN" - TKT-2026-000008)
    await page.fill('input[placeholder="Search ticket number or summary…"]', '000008');
    await page.waitForTimeout(500);
    
    await page.locator('text=View').first().click();
    
    // Check if Claim button exists, if yes click it
    const claimBtn = page.locator('text=Claim Ticket');
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
      // Should now show "Assigned to You" or similar
    }
    
    // Update status to IN PROGRESS
    await page.locator('select.zen-select').nth(2).selectOption('IN_PROGRESS'); // Status select (0=Assignee, 1=IT Priority, 2=Status)
    
    await page.screenshot({ path: getScreenshotPath('ticket_claimed') });
  });

  test('E2E-STAFF-05: Post public comment', async ({ page }) => {
    await page.locator('text=View').first().click();
    
    // Assuming there's a textarea for comments
    // The exact selector depends on implementation.
    // In Issue 5, we used textarea for comment input.
    const commentInput = page.locator('textarea[placeholder="Write a public comment to the requester..."]');
    await commentInput.fill('This is a test public comment from Playwright');
    
    const submitBtn = page.locator('text=Post Comment');
    await submitBtn.click();
    
    await expect(page.getByText('This is a test public comment from Playwright').first()).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('ticket_public_comment') });
  });

  test('E2E-STAFF-06: Post internal note', async ({ page }) => {
    await page.locator('text=View').first().click();
    
    const noteInput = page.locator('textarea[placeholder="Write an internal note..."]');
    await noteInput.fill('This is a private internal note for staff');
    
    const submitBtn = page.locator('text=Add Note');
    await submitBtn.click();
    
    await expect(page.getByText('This is a private internal note for staff').first()).toBeVisible();
    await page.screenshot({ path: getScreenshotPath('ticket_internal_note') });
  });
});
