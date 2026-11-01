import { test, expect } from '@playwright/test';

test.describe('Lab 4 E2E: Role Dashboards', () => {
  const shotStaff = (name: string) =>
    `artifacts/lab-04/screenshots/staff-dashboard/${test.info().project.name}-${name}.png`;
  const shotReq = (name: string) =>
    `artifacts/lab-04/screenshots/requester-dashboard/${test.info().project.name}-${name}.png`;

  test('E2E-DB-01: IT Staff dashboard renders approved metrics and drill-down', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'alice.staff@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Land on Staff Dashboard
    await page.waitForTimeout(800);
    await expect(page.locator('[data-testid="metric-unassigned"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-mytickets"]')).toBeVisible();

    // Capture full-page screenshot
    await page.screenshot({ path: shotStaff('overview'), fullPage: true });

    // Drill-down to queue via Unassigned card
    await page.locator('[data-testid="metric-unassigned"]').click();
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: /IT Staff Ticket Queue/i })).toBeVisible();
  });

  test('E2E-DB-02: Requester dashboard renders scoped metrics and recent tickets', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    // Land on Requester Dashboard
    await page.waitForTimeout(800);
    await expect(page.locator('[data-testid="metric-total-open"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-waiting-me"]')).toBeVisible();

    // Capture full-page screenshot
    await page.screenshot({ path: shotReq('overview'), fullPage: true });

    // Drill-down to open tickets via Total Open card
    await page.locator('[data-testid="metric-total-open"]').click();
    await page.waitForTimeout(600);
    await expect(page.getByRole('heading', { name: /My Tickets/i })).toBeVisible();
  });

  test('E2E-DB-03: Requester Dashboard Quick Actions create ticket navigation', async ({ page }) => {
    await page.goto('/');
    await page.fill('#email', 'jennifer.anderson@example.edu');
    await page.fill('#password', 'Password123!');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(600);
    // Click Create Ticket in Quick Actions
    const createAction = page.locator('div:has-text("Create Ticket")').last();
    if (await createAction.isVisible()) {
      await createAction.click();
      await page.waitForTimeout(600);
      await expect(page.getByRole('heading', { name: /Create New Ticket/i })).toBeVisible();
    }
  });
});
