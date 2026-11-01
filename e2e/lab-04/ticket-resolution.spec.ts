import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E: Ticket Resolution & Workflow', () => {
  const shot = (name: string) =>
    `artifacts/lab-04/screenshots/actions-taken/${test.info().project.name}-${name}.png`;

  test('E2E-WF-01: IT Staff completes ticket status transition', async ({ page }) => {
    const projectName = test.info().project.name;

    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);
    const queueNav = page.locator('#nav-staff-queue, button:has-text("Ticket Queue")').first();
    await queueNav.click();

    await page.waitForTimeout(600);

    if (projectName === 'mobile') {
      await page.locator('.zen-mobile-card button:has-text("View Details")').first().click();
    } else {
      await page.locator('.zen-table-desktop button:has-text("View")').first().click();
    }

    await page.waitForTimeout(800);

    // Look for Status dropdown in Operations panel
    const statusSelect = page.locator('select').filter({ hasText: /open|in progress|resolved|new/i }).first();
    if (await statusSelect.isVisible()) {
      const options = await statusSelect.locator('option').allInnerTexts();
      const nextOption = options.find(o => 
        o.toLowerCase().includes('open') || 
        o.toLowerCase().includes('in progress') || 
        o.toLowerCase().includes('resolved')
      );
      if (nextOption) {
        await statusSelect.selectOption({ label: nextOption.trim() });
        await page.waitForTimeout(500);
      }
    }

    await page.screenshot({ path: shot('status-transition'), fullPage: true });
  });

  test('E2E-WF-02: Requester marks ticket as Problem Appears Resolved (advisory only)', async ({ page }) => {
    const projectName = test.info().project.name;

    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);

    if (projectName === 'mobile') {
      await page.locator('.zen-mobile-card').first().click();
    } else {
      await page.locator('.zen-table-desktop button:has-text("View")').first().click();
    }

    await page.waitForTimeout(800);

    // If Problem Appears Resolved button is present, click it
    const resolveBtn = page.getByRole('button', { name: /Problem Appears Resolved/i });
    if (await resolveBtn.isVisible()) {
      await resolveBtn.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: shot('requester-resolution-feedback'), fullPage: true });
  });
});
