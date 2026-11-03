import axe from 'axe-core';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { cdp, page } from 'vitest/browser';

import { MultiSelect } from './MultiSelect';

const teams = ['Design', 'Engineering', 'Finance', 'Legal', 'Marketing'].map(
  (label) => ({ value: label.toLowerCase(), label }),
);

// Mirrors a real page: a main landmark that also hosts the menu portal.
function Page({
  initial = [],
  disabled = false,
}: {
  initial?: string[];
  disabled?: boolean;
}) {
  const [values, setValues] = useState<string[]>(initial);
  const [menuHost, setMenuHost] = useState<HTMLDivElement | null>(null);
  return (
    <main>
      <h1>Filter</h1>
      <label htmlFor="teams">Teams</label>
      <MultiSelect
        inputId="teams"
        options={teams}
        values={values}
        onChange={setValues}
        disabled={disabled}
        menuPortalTarget={menuHost}
      />
      <div ref={setMenuHost} />
    </main>
  );
}

// Known issue, see README: white on the default #2684FF OK button is ~3.6:1.
// Excluded from the state scans and tracked by its own test below.
const KNOWN_CONTRAST_ISSUE = '.multiselect-confirm';

async function scan(
  context: axe.ElementContext = { exclude: [KNOWN_CONTRAST_ISSUE] },
) {
  const { violations } = await axe.run(context, {
    runOnly: [
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22aa',
      'best-practice',
    ],
    // The test harness page has no lang or title; not part of the component.
    rules: {
      'html-has-lang': { enabled: false },
      'document-title': { enabled: false },
    },
  });
  return violations.map(
    (violation) => `${violation.id}: ${violation.nodes.length} node(s)`,
  );
}

const input = () => page.getByRole('combobox', { name: 'Teams' });

afterEach(async () => {
  await page.viewport(414, 896);
  await cdp().send('Emulation.setEmulatedMedia', { features: [] });
});

test('closed and empty', async () => {
  await render(<Page />);
  expect(await scan()).toEqual([]);
});

test('open and empty', async () => {
  await render(<Page />);
  await input().click();
  expect(await scan()).toEqual([]);
});

test('open with a draft', async () => {
  await render(<Page initial={['design']} />);
  await input().click();
  await page.getByRole('option', { name: 'Finance' }).click();
  expect(await scan()).toEqual([]);
});

test('closed with confirmed tags', async () => {
  await render(<Page initial={teams.map((team) => team.value)} />);
  expect(await scan()).toEqual([]);
});

test('disabled', async () => {
  await render(<Page initial={['design']} disabled />);
  expect(await scan()).toEqual([]);
});

test('open on a 320px viewport', async () => {
  await page.viewport(320, 640);
  await render(<Page initial={['design', 'engineering', 'finance']} />);
  await input().click();
  expect(await scan()).toEqual([]);
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
});

test('open in forced-colors mode', async () => {
  await cdp().send('Emulation.setEmulatedMedia', {
    features: [{ name: 'forced-colors', value: 'active' }],
  });
  await render(<Page initial={['design']} />);
  await input().click();
  expect(await scan()).toEqual([]);

  const control = document
    .querySelector('#teams')!
    .closest('[class*="control"]')!;
  expect(getComputedStyle(control).outlineStyle).toBe('solid');
});

// Flip to `test` once --multiselect-primary defaults to an AA-compliant blue.
test.fails('OK button text meets 4.5:1 contrast', async () => {
  await render(<Page initial={['design']} />);
  await input().click();
  await page.getByRole('option', { name: 'Finance' }).click();
  expect(await scan(document)).toEqual([]);
});
