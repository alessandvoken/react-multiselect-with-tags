import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Known issue, see README: white on the default #2684FF OK button is ~3.6:1.
const KNOWN_CONTRAST_ISSUE = '.multiselect-confirm';

test('filter teams with a draft, then apply once', async ({ page }) => {
  await page.goto('/');

  const teams = page.getByRole('combobox', { name: 'Teams' });
  const applied = page.locator('.demo-summary dd').first();
  const updates = page.locator('.demo-summary dd').last();
  const option = (name: string) => page.getByRole('option', { name });
  const button = (name: string) =>
    page.getByRole('button', { name, exact: true });

  await expect(applied).toHaveText('None');
  await expect(updates).toHaveText('0');

  // Draft: search, tick three options, nothing applied yet.
  await teams.click();
  await teams.fill('eng');
  await option('Engineering').click();
  await teams.fill('');
  await option('Design').click();
  await option('Finance').click();
  await expect(updates).toHaveText('0');
  await expect(applied).toHaveText('None');

  // Closing without OK discards the draft.
  await page.keyboard.press('Escape');
  await expect(page.getByRole('listbox')).toBeHidden();
  await expect(updates).toHaveText('0');

  // Apply with the keyboard: Tab to the footer, Enter on OK.
  await teams.press('ArrowDown');
  await page.keyboard.press('Enter');
  await option('Engineering').click();
  await page.keyboard.press('Tab');
  await expect(button('Reset')).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(teams).toBeFocused();
  await expect(applied).toHaveText('Customer Success, Engineering');
  await expect(updates).toHaveText('1');

  // Removing a tag applies at once.
  await page.getByRole('button', { name: 'Remove Customer Success' }).click();
  await expect(applied).toHaveText('Engineering');
  await expect(updates).toHaveText('2');

  // Reset clears immediately and keeps the menu open.
  await teams.click();
  await button('Reset').click();
  await expect(applied).toHaveText('None');
  await expect(updates).toHaveText('3');
  await expect(page.getByRole('listbox')).toBeVisible();

  const { violations } = await new AxeBuilder({ page })
    .exclude(KNOWN_CONTRAST_ISSUE)
    .analyze();
  expect(violations.map((violation) => violation.id)).toEqual([]);
});

test('many applied teams stay on one row with +N', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  await page.goto('/');

  const teams = page.getByRole('combobox', { name: 'Teams' });
  await teams.click();
  for (const name of ['Design', 'Engineering', 'Finance', 'Legal']) {
    await page.getByRole('option', { name }).click();
  }
  await page.getByRole('button', { name: 'OK', exact: true }).click();

  const counter = page.locator('.multiselect-more').first();
  await expect(counter).toBeVisible();
  await expect(counter).toContainText(/^\+\d/);

  await counter.hover();
  await expect(page.locator('.multiselect-tooltip li')).not.toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
});
