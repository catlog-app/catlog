import { expect, test, type Page } from '@playwright/test';

/** Open the app and create the first cat. */
async function startApp(page: Page, catName = 'Mila') {
  await page.goto('./');
  await page.getByLabel('Your cat’s name').fill(catName);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { name: new RegExp(catName) })).toBeVisible();
}

const quick = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });
const tab = (page: Page, label: string) => page.getByRole('button', { name: label, exact: true });

test('records entries, offers own tags, and makes no outside requests or CSP errors', async ({
  page,
}) => {
  const outside: string[] = [];
  const problems: string[] = [];
  page.on('request', (r) => {
    const url = r.url();
    if (
      !url.startsWith('http://localhost:4173/') &&
      !url.startsWith('blob:') &&
      !url.startsWith('data:')
    ) {
      outside.push(url);
    }
  });
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(m.text());
  });
  page.on('pageerror', (e) => problems.push(e.message));

  await startApp(page);

  // A poop entry without any texture is valid.
  await quick(page, 'Poop').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await tab(page, 'Log').click();
  await expect(page.getByRole('button', { name: /Poop/ }).filter({ hasText: ':' })).toHaveCount(1);

  // An empty sleep entry with an own tag. The tag is offered again next time.
  await quick(page, 'Sleep').click();
  await page.getByLabel('Add your own…').fill('Plays at 3 am');
  await page.getByRole('button', { name: 'Add tag' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await quick(page, 'Sleep').click();
  await expect(page.locator('.chip', { hasText: 'Plays at 3 am' })).toBeVisible();
  await page.keyboard.press('Escape');

  expect(outside).toEqual([]);
  expect(problems).toEqual([]);
});

test('shows two overlapping periods as bars on the same day', async ({ page }) => {
  await startApp(page);
  for (const title of ['Antibiotics', 'New food']) {
    await tab(page, 'Periods').click();
    await page.getByRole('button', { name: 'New period' }).click();
    await page.getByLabel('Name').fill(title);
    await page.getByRole('button', { name: 'Save' }).click();
  }
  await tab(page, 'Calendar').click();
  const bars = page.locator('.cell[data-today="true"] .bar:not(.bar--empty)');
  await expect(bars).toHaveCount(2);
  // Both periods are named in the legend, so color is not the only signal.
  await expect(page.getByRole('button', { name: /Antibiotics/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /New food/ })).toBeVisible();
});

test('keeps working offline after the first load', async ({ page, context }) => {
  await startApp(page, 'Offline cat');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Reload once, so the service worker controls the page.
  await page.reload();
  await expect(page.getByRole('heading', { name: /Offline cat/ })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: /Offline cat/ })).toBeVisible();
  await context.setOffline(false);
});

test('backup, wipe and import brings the data back', async ({ page }, testInfo) => {
  // Firefox cannot share files. Simulate that, so the test follows the download path.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined });
  });
  await startApp(page);
  await quick(page, 'Water').click();
  await page.getByRole('button', { name: 'A lot' }).click();
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Settings' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Back up now' }).click(),
  ]);
  const file = testInfo.outputPath('saved-copy.json');
  await download.saveAs(file);
  await expect(page.getByText(/Saved to Downloads/)).toBeVisible();

  // Same as "clear site data": delete the database and reload.
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.deleteDatabase('catlog');
        req.onsuccess = () => resolve();
        req.onerror = () => reject(new Error('delete failed'));
      }),
  );
  await page.reload();
  await expect(page.getByLabel('Your cat’s name')).toBeVisible();

  await page.getByRole('button', { name: 'I already have a backup' }).click();
  await page.getByLabel('Choose a backup file (.json).').setInputFiles(file);
  await expect(page.getByText(/to add/)).toBeVisible();
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  // The start screen goes away as soon as there is a cat, so the app opens by itself.
  await expect(page.getByRole('heading', { name: /Mila/ })).toBeVisible();

  await tab(page, 'Log').click();
  await expect(page.getByText('Water · 🌊 A lot')).toBeVisible();
});

test('asks for a backup when the data is old, and the reminder can be dismissed', async ({
  page,
}) => {
  // An old backup with one entry. Its update time is far in the past, so a reminder is due.
  const old = {
    app: 'catlog',
    version: 1,
    exportedAt: 1,
    cats: [
      {
        id: 'c1',
        name: 'Mila',
        archived: false,
        customTags: { sleep: [], stress: [] },
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    events: [
      {
        id: 'e1',
        catId: 'c1',
        type: 'water',
        water: 2,
        at: 1_000,
        tz: 'UTC',
        date: '1970-01-01',
        time: '00:00',
        note: '',
        createdAt: 1,
        updatedAt: 1,
      },
    ],
    periods: [],
    settings: {},
  };
  await page.goto('./');
  await page.getByRole('button', { name: 'I already have a backup' }).click();
  await page.getByLabel('Choose a backup file (.json).').setInputFiles({
    name: 'old.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(old)),
  });
  await page.getByRole('button', { name: 'Import', exact: true }).click();

  const reminder = page.getByText(
    'Back up your data. You added new entries since your last backup.',
  );
  await expect(reminder).toBeVisible();
  await page
    .locator('.banner', { hasText: 'Back up your data.' })
    .getByRole('button', { name: 'Dismiss' })
    .click();
  await expect(reminder).toBeHidden();
});

test('does not scroll sideways on a narrow screen', async ({ page }) => {
  await startApp(page);
  for (const label of ['Calendar', 'Log', 'Periods', 'Analysis']) {
    await tab(page, label).click();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${label} screen`).toBeLessThanOrEqual(0);
  }
});
