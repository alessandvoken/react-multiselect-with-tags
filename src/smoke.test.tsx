import { expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';

test('renders in a real browser', async () => {
  await render(<h1>Hello</h1>);

  await expect.element(page.getByRole('heading')).toBeVisible();
});
