import { test, expect } from '@playwright/test';

/**
 * Critical path 3: recruiter publishes a job, an application arrives, and the
 * keyboard-accessible stage move persists across a reload.
 */
test('recruiter moves an application and the move persists', async ({ page, request }) => {
  // Register a company through the UI.
  await page.goto('/register');
  // The radio is visually hidden inside its label (an accessible pattern where
  // the label is the hit target), so click the label the way a person would.
  await page.locator('label').filter({ hasText: 'Hiring' }).click();
  await expect(page.getByRole('radio', { name: 'Hiring' })).toBeChecked();
  const email = `bjorn+${Date.now()}@example.no`;
  await page.getByLabel(/Company name/).fill('Fjellheim AS');
  await page.getByLabel(/Your name/).fill('Bjørn Aas');
  await page.getByLabel(/Email/).fill(email);
  await page.getByLabel(/Password/).fill('Passw0rd!x');
  await page.getByRole('button', { name: 'Register company' }).click();
  await expect(page).toHaveURL(/\/company$/);

  // Create + publish a posting. The title is unique per run so the lookup
  // below cannot latch onto a posting left behind by an earlier run.
  const jobTitle = `Trail Guide Engineer ${Date.now()}`;
  await page.getByRole('link', { name: 'New job posting' }).click();
  await page.getByLabel(/Job title/).fill(jobTitle);
  await page.getByLabel(/Description/).fill('Guide candidates along the trail.');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await expect(page).toHaveURL(/\/company$/);
  await page.getByRole('button', { name: 'Publish' }).click();
  // The status badge — not the "Published <title>" toast that also appears.
  await expect(page.getByText('Published', { exact: true })).toBeVisible();

  // A candidate applies (via the API, using a fresh registration).
  const reg = await request.post('/api/candidate/register', {
    data: { displayName: 'Nora', email: `nora+${Date.now()}@example.no`, password: 'Passw0rd!x' },
  });
  const { tokens } = await reg.json();
  const jobs = await (await request.get('/api/public/jobs?page=1&pageSize=100')).json();
  const job = jobs.items.find((j: { title: string }) => j.title === jobTitle);
  expect(job, 'the published posting should be on the public board').toBeTruthy();
  await request.post('/api/candidate/applications', {
    headers: { authorization: `Bearer ${tokens.accessToken}` },
    data: { jobPostingId: job.id, coverLetter: null },
  });

  // Open the pipeline and move the card with the keyboard-accessible button.
  await page.getByRole('link', { name: 'View pipeline' }).click();
  const applied = page.getByRole('listitem', { name: /^Applied/ });
  await expect(applied).toContainText('Candidate');
  await page.getByRole('button', { name: '→ Screening' }).click();

  const screening = page.getByRole('listitem', { name: /^Screening — 1 application/ });
  await expect(screening).toBeVisible();

  // Persisted: reload and the card is still in Screening.
  await page.reload();
  await expect(page.getByRole('listitem', { name: /^Screening — 1 application/ })).toBeVisible();
});
