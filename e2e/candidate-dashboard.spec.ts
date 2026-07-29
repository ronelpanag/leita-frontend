import { test, expect } from '@playwright/test';

/** Critical path 2: register → apply to a job → see it in the dashboard with a stage. */
test('a candidate application shows on the dashboard with its stage', async ({ page }) => {
  await page.goto('/register');
  const email = `ingrid+${Date.now()}@example.no`;
  await page.getByLabel(/Full name/).fill('Ingrid Moe');
  await page.getByLabel(/Email/).fill(email);
  await page.getByLabel(/Password/).fill('Passw0rd!x');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/candidate$/);

  // Apply to the seeded job.
  await page.goto('/jobs/11111111-1111-1111-1111-111111111111');
  await page.getByRole('button', { name: 'Apply for this role' }).click();
  await expect(page).toHaveURL(/\/candidate\/apply\//);
  await page.getByLabel(/Cover letter/).fill('I know the trail.');
  await page.getByRole('button', { name: 'Submit application' }).click();

  // Dashboard lists it with the Applied stage badge.
  await expect(page).toHaveURL(/\/candidate$/);
  await expect(page.getByText('Frontend Engineer')).toBeVisible();
  // The stage badge — not the "Applied <date>" line next to it.
  await expect(page.getByText('Applied', { exact: true })).toBeVisible();
});
