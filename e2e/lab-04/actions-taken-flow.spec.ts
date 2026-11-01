import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E: Actions Taken Flow', () => {
  const shot = (filename: string) =>
    `artifacts/lab-04/screenshots/actions-taken/${filename}`;

  test('E2E-AT-01: IT Staff logs in, opens Ticket with Actions Taken, views full list', async ({ page }) => {
    const projectName = test.info().project.name;

    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);
    const queueNav = page.locator('#nav-staff-queue');
    if (await queueNav.isVisible()) {
      await queueNav.click();
    } else {
      await page.locator('text=Ticket Queue').first().click();
    }

    // Filter/search for ticket 000007 which has seeded Actions Taken
    await page.waitForSelector('input[placeholder="Search ticket number or summary…"]');
    await page.fill('input[placeholder="Search ticket number or summary…"]', '000007');
    await page.waitForTimeout(500);

    // Click View or Card on ticket 000007
    await page.evaluate(() => {
      const card = document.querySelector('.zen-mobile-card') as HTMLElement;
      if (card) { card.click(); return; }
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find((b: any) => b.textContent?.trim() === 'View');
      if (viewBtn) viewBtn.click();
    });

    await page.waitForTimeout(800);

    // Verify Actions Taken heading is visible
    const actionsHeading = page.locator('[data-testid="actions-taken-section"]');
    await expect(actionsHeading).toBeVisible();

    // Capture full-page screenshot showing the full ticket and Actions Taken list
    if (projectName === 'desktop') {
      await page.screenshot({ path: shot('desktop-list.png'), fullPage: true });
    } else if (projectName === 'tablet') {
      await page.screenshot({ path: shot('tablet-list.png'), fullPage: true });
    } else if (projectName === 'mobile') {
      await page.screenshot({ path: shot('mobile-list.png'), fullPage: true });
    }
  });

  test('E2E-AT-02: IT Staff opens Record Action form, triggers validation error', async ({ page }) => {
    const projectName = test.info().project.name;

    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);
    const queueNav = page.locator('#nav-staff-queue');
    if (await queueNav.isVisible()) {
      await queueNav.click();
    } else {
      await page.locator('text=Ticket Queue').first().click();
    }

    await page.waitForSelector('input[placeholder="Search ticket number or summary…"]');
    await page.fill('input[placeholder="Search ticket number or summary…"]', '000007');
    await page.waitForTimeout(500);

    await page.evaluate(() => {
      const card = document.querySelector('.zen-mobile-card') as HTMLElement;
      if (card) { card.click(); return; }
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find((b: any) => b.textContent?.trim() === 'View');
      if (viewBtn) viewBtn.click();
    });

    await page.waitForTimeout(800);

    // Click "+ Record Action" button
    const recordBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(recordBtn).toBeVisible();
    await recordBtn.click();

    await page.waitForSelector('[data-testid="action-form"]');

    // Fill Action Description and Result
    await page.fill('#actionDescription', 'Reconfigured Wi-Fi AP channel mapping.');
    await page.fill('#result', 'Interference reduced but requires verification.');

    // Check "Follow-Up Required"
    await page.check('#followUpRequired');
    await page.waitForTimeout(200);

    // Submit without follow-up note to trigger validation
    await page.click('button[type="submit"]:has-text("Save Action")');
    await page.waitForTimeout(400);

    // Verify inline validation error is visible on the follow-up note field
    await expect(page.locator('#followup-error')).toBeVisible();

    if (projectName === 'desktop') {
      await page.screenshot({ path: shot('desktop-create-validation.png'), fullPage: true });
    }
  });

  test('E2E-AT-03: Requester views Ticket — Actions Taken visible in read-only mode', async ({ page }) => {
    const projectName = test.info().project.name;

    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);

    // Click on ticket TKT-2026-000007 in Recent Tickets (either button View, link, or mobile card)
    await page.evaluate(() => {
      const card = document.querySelector('.zen-mobile-card') as HTMLElement;
      if (card) { card.click(); return; }
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find((b: any) => b.textContent?.trim() === 'View');
      if (viewBtn) { viewBtn.click(); return; }
      const link = Array.from(document.querySelectorAll('a, button')).find((el: any) => el.textContent?.includes('000007'));
      if (link) (link as HTMLElement).click();
    });

    await page.waitForTimeout(800);

    // Verify Actions Taken section is visible
    const actionsSection = page.locator('[data-testid="actions-taken-section"]');
    await expect(actionsSection).toBeVisible();

    // Verify "+ Record Action" button is NOT present for Requester
    const addBtn = page.locator('[data-testid="add-action-btn"]');
    await expect(addBtn).toHaveCount(0);

    if (projectName === 'mobile') {
      await page.screenshot({ path: shot('mobile-requester-view.png'), fullPage: true });
    }
  });
});
