import { test, expect } from '@playwright/test';

/** Critical path 1: anonymous browse → apply → login → back to the job. */
test('anonymous visitor browses, then is routed through login to apply', async ({ page }) => {
  await page.goto('/jobs');
  await expect(page.getByRole('heading', { name: 'Open roles' })).toBeVisible();

  const jobLink = page.getByRole('link', { name: /Frontend Engineer/ });
  await expect(jobLink).toBeVisible();
  await jobLink.click();

  await expect(page.getByRole('heading', { name: 'Frontend Engineer' })).toBeVisible();
  await page.getByRole('button', { name: 'Apply for this role' }).click();

  // Redirected to login with a returnTo pointing back at the job.
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fjobs%2F/);

  // Register a candidate first (link to register), then the app returns here.
  await page.getByRole('link', { name: 'Create an account' }).click();
  const email = `nora+${Date.now()}@example.no`;
  await page.getByLabel(/Full name/).fill('Nora Berg');
  await page.getByLabel(/Email/).fill(email);
  await page.getByLabel(/Password/).fill('Passw0rd!x');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/candidate$/);
});
