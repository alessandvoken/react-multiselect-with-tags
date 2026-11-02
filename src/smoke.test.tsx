import { expect, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';

test('renders in a real browser', async () => {
  await render(<h1>Hello</h1>);

  await expect.element(page.getByRole('heading')).toBeVisible();
});
