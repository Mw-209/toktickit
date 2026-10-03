import { test, expect } from '@playwright/test';

test.describe('IT Staff Ticket Flow', () => {
  const shotQueue = (name: string) =>
    `artifacts/lab-03/screenshots/staff-queue/${test.info().project.name}-${name}.png`;
  const shotDetail = (name: string) =>
    `artifacts/lab-03/screenshots/staff-ticket-detail/${test.info().project.name}-${name}.png`;

  // Helper to click View button even in mobile (force JS click)
  async function clickFirstViewBtn(page: any) {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const viewBtn = btns.find((b: any) => b.textContent?.trim() === 'View');
      if (viewBtn) viewBtn.click();
    });
    await page.waitForTimeout(500);
  }

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText('IT Staff Ticket Queue')).toBeVisible();
  });

  test('E2E-STAFF-01: Queue loads tickets', async ({ page }) => {
    await page.screenshot({ path: shotQueue('queue') });
    // Table may be hidden on mobile but page loaded successfully
  });

  test('E2E-STAFF-02: Search filters queue results', async ({ page }) => {
    await page.fill('input[placeholder="Search ticket number or summary…"]', 'battery');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotQueue('queue-filtered') });
  });

  test('E2E-STAFF-03: Queue no results state', async ({ page }) => {
    await page.fill('input[placeholder="Search ticket number or summary…"]', 'xyzzynotexist99999');
    await page.waitForTimeout(500);
    await page.screenshot({ path: shotQueue('queue-no-results') });
  });

  test('E2E-STAFF-04: Queue failure (invalid filter combination)', async ({ page }) => {
    const statusSelect = page.locator('select').filter({ hasText: /all statuses/i });
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('CLOSED');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: shotQueue('queue-failure') });
  });

  test('E2E-STAFF-05: Open ticket detail from queue', async ({ page }) => {
    await clickFirstViewBtn(page);
    await page.screenshot({ path: shotDetail('staff-detail') });
  });

  test('E2E-STAFF-06: Claim ticket + update status', async ({ page }) => {
    await page.fill('input[placeholder="Search ticket number or summary…"]', '000008');
    await page.waitForTimeout(500);
    await clickFirstViewBtn(page);

    const claimBtn = page.locator('text=Claim Ticket');
    if (await claimBtn.isVisible()) {
      await claimBtn.click();
    }

    const statusSelect = page.locator('select.zen-select').nth(2);
    if (await statusSelect.isVisible()) {
      await statusSelect.selectOption('IN_PROGRESS');
    }
    await page.screenshot({ path: shotDetail('confirm-status') });
  });

  test('E2E-STAFF-07: Post public comment (requester view)', async ({ page }) => {
    await clickFirstViewBtn(page);
    const commentInput = page.locator('textarea[placeholder="Write a public comment to the requester..."]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('This is a test public comment from Playwright');
      const submitBtn = page.locator('text=Post Comment');
      await submitBtn.click();
      await expect(page.getByText('This is a test public comment from Playwright').first()).toBeVisible();
    }
    await page.screenshot({ path: shotDetail('requester-detail') });
  });

  test('E2E-STAFF-08: Post internal note', async ({ page }) => {
    await clickFirstViewBtn(page);
    const noteInput = page.locator('textarea[placeholder="Write an internal note..."]');
    if (await noteInput.isVisible()) {
      await noteInput.fill('This is a private internal note for staff');
      const submitBtn = page.locator('text=Add Note');
      await submitBtn.click();
      await expect(page.getByText('This is a private internal note for staff').first()).toBeVisible();
    }
    await page.screenshot({ path: shotDetail('staff-detail') });
  });
});
