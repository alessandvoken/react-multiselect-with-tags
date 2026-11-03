// Captures the README screenshots from the built demo with Playwright.
// Run with `pnpm screenshots` (builds, serves on port 4179, writes PNGs to
// public/screenshots/).
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

import { chromium, type Page } from '@playwright/test';

const PORT = 4179;
const URL = `http://localhost:${PORT}/`;
const OUT = 'public/screenshots';

const server = spawn(
  'pnpm',
  ['preview', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore' },
);

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(URL)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Preview server did not start on ${URL}`);
}

const teams = (page: Page) => page.getByRole('combobox', { name: 'Teams' });
const option = (page: Page, name: string) =>
  page.getByRole('option', { name, exact: true });
const button = (page: Page, name: string) =>
  page.getByRole('button', { name, exact: true });

async function apply(page: Page, names: string[]) {
  await teams(page).click();
  for (const name of names) await option(page, name).click();
  await button(page, 'OK').click();
}

// Top of the page, tall enough for the card plus the open menu and footer.
async function shoot(page: Page, name: string, height = 840) {
  await page.waitForTimeout(150);
  const width = page.viewportSize()!.width;
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width, height },
  });
  console.log(`  ${name}.png`);
}

type Shot = {
  name: string;
  viewport?: { width: number; height: number };
  height?: number;
  // Leave the pointer where `run` put it, e.g. to keep a hover open.
  keepPointer?: boolean;
  run: (page: Page) => Promise<void>;
};

const shots: Shot[] = [
  { name: '01-empty', height: 560, run: async () => {} },
  {
    name: '02-draft-before-ok',
    run: async (page) => {
      await teams(page).click();
      for (const name of ['Design', 'Engineering', 'Finance']) {
        await option(page, name).click();
      }
      await option(page, 'Legal').hover();
    },
    keepPointer: true,
  },
  {
    name: '03-applied-tags-overflow',
    height: 520,
    keepPointer: true,
    run: async (page) => {
      await apply(page, [
        'Customer Success',
        'Design',
        'Engineering',
        'Finance',
        'Legal',
        'Marketing',
      ]);
      await page.locator('.multiselect-more').first().hover();
      await page.locator('.multiselect-tooltip').waitFor();
    },
  },
  {
    name: '04-search',
    run: async (page) => {
      // Selecting clears the search, so tick first, then type the query.
      await teams(page).click();
      await teams(page).fill('sales');
      await option(page, 'Sales').click();
      await teams(page).fill('sales');
    },
  },
  {
    name: '05-keyboard-footer-focus',
    run: async (page) => {
      await apply(page, ['Design']);
      await teams(page).press('ArrowDown');
      await page.keyboard.press('Tab');
    },
  },
  {
    name: '06-disabled',
    height: 560,
    run: async (page) => {
      await apply(page, ['Design', 'Engineering']);
      await page.getByLabel('Disabled').check();
    },
  },
  {
    name: '07-mobile-draft',
    viewport: { width: 390, height: 780 },
    height: 780,
    run: async (page) => {
      await apply(page, ['Design', 'Engineering', 'Research and Development']);
      await teams(page).click();
      await option(page, 'Finance').click();
    },
  },
];

await mkdir(OUT, { recursive: true });
await waitForServer();
const browser = await chromium.launch();
try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: shot.viewport ?? { width: 960, height: 900 },
      deviceScaleFactor: 2,
    });
    await page.goto(URL);
    await shot.run(page);
    if (!shot.keepPointer) await page.mouse.move(0, 0);
    await shoot(page, shot.name, shot.height);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
