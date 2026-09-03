import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('E2E-01: Full End-to-End Requester Ticket Flow', () => {
  test('Complete responsive submission flow', async ({ page }) => {
    const screenshotDir = 'artifacts/lab-02/screenshots';

    // 1. Select Requester
    await page.goto('http://localhost:5173/');
    await expect(page.locator('text=Select Development Requester')).toBeVisible();
    await page.selectOption('select', { label: 'Jennifer Anderson (jennifer.anderson@example.edu)' });
    await page.click('button:has-text("Continue")');

    // 2. My Tickets List View
    await expect(page.locator('h2:has-text("My Tickets")')).toBeVisible();
    await page.waitForTimeout(1000); // Wait for API to load tickets
    await page.screenshot({ path: `${screenshotDir}/my-tickets/list-view.png`, fullPage: true });

    // 3. Create Ticket & Validation Error
    await page.click('button:has-text("Create Ticket"), a:has-text("Create Ticket")');
    await expect(page.locator('h2:has-text("Create New Ticket")')).toBeVisible();
    
    // Fill category, system, priority but leave Summary empty
    await page.locator('#ticket-category').selectOption({ label: 'Hardware' });
    await page.locator('#ticket-system').selectOption({ label: 'Corporate Laptop' });
    await page.click('button:has-text("HIGH")');
    await page.fill('#ticket-description', 'My laptop battery is draining very fast.');
    
    // Attempt submit
    await page.click('#btn-submit-ticket');
    await expect(page.locator('text=Summary is required')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/create-ticket/validation-error.png`, fullPage: true });

    // 4. Form Filled & Upload File
    await page.fill('#ticket-summary', 'Laptop battery issue E2E test');
    
    // Create a dummy file and upload
    const dummyFile = Buffer.from('dummy pdf content');
    await page.setInputFiles('#ticket-attachments', {
      name: 'e2e_test_file.pdf',
      mimeType: 'application/pdf',
      buffer: dummyFile
    });
    
    // Screenshot filled form
    await page.screenshot({ path: `${screenshotDir}/create-ticket/form-filled.png`, fullPage: true });

    // 5. Submit and verify redirect
    await page.click('#btn-submit-ticket');
    await expect(page.locator('text=created successfully')).toBeVisible();
    await expect(page.locator('tr:has-text("Laptop battery issue E2E test")').first()).toBeVisible();

    // 6. Ticket Detail View
    await page.locator('tr:has-text("Laptop battery issue E2E test")').first().click();
    await expect(page.locator('text=Ticket Detail for ID')).not.toBeVisible(); // Ensure placeholder is gone
    await expect(page.locator('text=Problem Description')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/ticket-detail/view-mode.png`, fullPage: true });

    // 7. Soft-Removal Modal
    await page.click('button:has-text("Remove")');
    await expect(page.locator('text=Remove Attachment')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/ticket-detail/soft-removal-modal.png` });

    // 8. Confirm Removal and verify state
    await page.fill('textarea[placeholder*="state why"]', 'Removed during E2E test');
    await page.click('button:has-text("Confirm Removal")');
    
    await expect(page.locator('text=Removed on:')).toBeVisible();
    await expect(page.locator('text=Removed during E2E test')).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/ticket-detail/removed-state.png`, fullPage: true });
    
    // 9. Cross-Requester Isolation Check
    // Get the current ticket ID from the URL (or UI if we had it, but we'll extract from URL if possible)
    // Actually we can just switch requester and ensure ticket is not in the list
    await page.click('button:has-text("Switch")');
    await page.selectOption('select', { label: 'David Lee (david.lee@example.edu)' });
    await page.click('button:has-text("Continue")');
    
    await expect(page.locator('h2:has-text("My Tickets")')).toBeVisible();
    await expect(page.locator('text=Laptop battery issue E2E test')).not.toBeVisible();
  });
});
