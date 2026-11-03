import { useState } from 'react';
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';

import { MultiSelect, type MultiSelectProps } from './MultiSelect';

const teams = [
  'Customer Success',
  'Design',
  'Engineering',
  'Finance',
  'Legal',
  'Marketing',
  'Research and Development',
].map((label) => ({ value: label.toLowerCase().replace(/ /g, '-'), label }));

type HostProps = Partial<MultiSelectProps> & {
  initial?: string[];
  width?: number;
  portal?: boolean;
};

// Owns the applied values like a real parent and records every onChange.
async function setup({
  initial = [],
  width,
  portal,
  ...props
}: HostProps = {}) {
  const calls: string[][] = [];

  function Host() {
    const [values, setValues] = useState<string[]>(initial);
    return (
      <form
        onSubmit={(event) => {
          event.preventDefault();
          calls.push(['SUBMIT']);
        }}
      >
        <button type="button">Before</button>
        <div style={{ width }}>
          <label htmlFor="teams">Teams</label>
          <MultiSelect
            inputId="teams"
            classNamePrefix="ms"
            options={teams}
            values={values}
            onChange={(next) => {
              calls.push(next);
              setValues(next);
            }}
            menuPortalTarget={portal ? document.body : undefined}
            {...props}
          />
        </div>
        <button type="button">After</button>
      </form>
    );
  }

  await render(<Host />);
  return { calls };
}

const input = () => page.getByRole('combobox', { name: 'Teams' });
const option = (name: string) => page.getByRole('option', { name });
const button = (name: string) =>
  page.getByRole('button', { name, exact: true });

// aria-selected is omitted on Apple devices, so the checkbox state is the
// cross-platform signal; both come from the same isOptionSelected.
function checkedLabels() {
  return [...document.querySelectorAll('.ms__option')]
    .filter((node) => node.querySelector('.multiselect-checkbox--checked'))
    .map((node) => node.textContent);
}

function visibleTags() {
  return [
    ...document.querySelectorAll(
      '.ms__value-container > .ms__multi-value .ms__multi-value__label',
    ),
  ].map((node) => node.textContent);
}

function counterText() {
  return document.querySelector(
    '.ms__value-container > .multiselect-more [aria-hidden]',
  )?.textContent;
}

const isMenuOpen = () => document.querySelector('[role="listbox"]') !== null;
const activeName = () => {
  const active = document.activeElement;
  return active instanceof HTMLElement ? active.id || active.textContent : '';
};
const statusText = () => document.querySelector('output')?.textContent ?? '';
const liveLog = () => document.querySelector('[role="log"]')?.textContent ?? '';

// Lets ResizeObserver callbacks and the re-render they trigger settle.
const nextFrames = () =>
  new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );

describe('draft and commit', () => {
  test('ticking options edits the draft only', async () => {
    const { calls } = await setup({ initial: ['design'] });
    await input().click();
    await option('Engineering').click();
    await option('Design').click();

    expect(checkedLabels()).toEqual(['Engineering']);
    expect(visibleTags()).toEqual(['Design']);
    expect(calls).toEqual([]);
    expect(isMenuOpen()).toBe(true);
  });

  test('OK applies once, closes the menu and returns focus', async () => {
    const { calls } = await setup();
    await input().click();
    await option('Design').click();
    await option('Finance').click();
    await button('OK').click();

    expect(calls).toEqual([['design', 'finance']]);
    expect(isMenuOpen()).toBe(false);
    await expect.element(input()).toHaveFocus();
  });

  test('OK with an unchanged selection does not call onChange', async () => {
    const { calls } = await setup({ initial: ['design'] });
    await input().click();
    await option('Finance').click();
    await option('Finance').click();
    await button('OK').click();

    expect(calls).toEqual([]);
  });

  test('closing without OK discards the draft', async () => {
    const { calls } = await setup({ initial: ['design'] });
    await input().click();
    await option('Legal').click();
    await userEvent.keyboard('{Escape}');
    await input().click();

    expect(checkedLabels()).toEqual(['Design']);
    expect(calls).toEqual([]);
  });

  // react-select treats an option found by reference in `value` as selected
  // without asking isOptionSelected; MultiSelect passes copies to avoid that.
  test('an applied value can be unticked and ticked again', async () => {
    await setup({ initial: ['design'] });
    await input().click();
    await option('Design').click();
    expect(checkedLabels()).toEqual([]);
    await option('Design').click();
    expect(checkedLabels()).toEqual(['Design']);
  });

  test('OK can apply an empty selection', async () => {
    const { calls } = await setup({ initial: ['design'] });
    await input().click();
    await option('Design').click();
    await expect.element(button('OK')).toBeEnabled();
    await button('OK').click();

    expect(calls).toEqual([[]]);
  });

  test('Reset clears the applied values at once and keeps the menu open', async () => {
    const { calls } = await setup({ initial: ['design', 'legal'] });
    await input().click();
    await option('Finance').click();
    await button('Reset').click();

    expect(calls).toEqual([[]]);
    expect(isMenuOpen()).toBe(true);
    expect(checkedLabels()).toEqual([]);
    expect(visibleTags()).toEqual([]);
    await expect.element(input()).toHaveFocus();
  });

  test('footer is disabled when draft and applied values are empty', async () => {
    await setup();
    await input().click();
    await expect.element(button('Reset')).toBeDisabled();
    await expect.element(button('OK')).toBeDisabled();
    await option('Design').click();
    await expect.element(button('OK')).toBeEnabled();
  });

  test('removing a tag applies immediately', async () => {
    const { calls } = await setup({ initial: ['design', 'legal'] });
    await page.getByRole('button', { name: 'Remove Design' }).click();
    expect(calls).toEqual([['legal']]);

    await input().click();
    await userEvent.keyboard('{Escape}');
    await userEvent.keyboard('{Backspace}');
    expect(calls).toEqual([['legal'], []]);
  });

  test('custom labels name the footer buttons', async () => {
    await setup({ resetLabel: 'Clear', confirmLabel: 'Apply' });
    await input().click();
    await expect.element(button('Clear')).toBeInTheDocument();
    await expect.element(button('Apply')).toBeInTheDocument();
  });

  test('footer buttons do not submit a surrounding form', async () => {
    const { calls } = await setup({ initial: ['design'] });
    await input().click();
    await option('Legal').click();
    await button('OK').click();
    await input().click();
    await button('Reset').click();

    expect(calls).toEqual([['design', 'legal'], []]);
  });

  test('a disabled control does not open', async () => {
    await setup({ disabled: true });
    expect(document.querySelector('input#teams:disabled')).not.toBeNull();
    await page.getByText('Select options').click({ force: true });
    expect(isMenuOpen()).toBe(false);
  });
});

describe.each([
  { name: 'inline menu', portal: false },
  { name: 'portalled menu', portal: true },
])('keyboard with $name', ({ portal }) => {
  test('Tab reaches the footer without selecting, then leaves', async () => {
    await setup({ initial: ['design'], portal });
    await input().click();
    await userEvent.keyboard('{ArrowDown}{Tab}');
    expect(activeName()).toBe('Reset');
    expect(isMenuOpen()).toBe(true);
    expect(checkedLabels()).toEqual(['Design']);

    await userEvent.keyboard('{Shift>}{Tab}{/Shift}');
    expect(activeName()).toBe('teams');
    expect(isMenuOpen()).toBe(true);

    await userEvent.keyboard('{Tab}{Tab}{Tab}');
    expect(activeName()).toBe('After');
    expect(isMenuOpen()).toBe(false);
  });

  test('Escape from the footer discards and returns focus', async () => {
    const { calls } = await setup({ initial: ['design'], portal });
    await input().click();
    await userEvent.keyboard('{ArrowDown}{Enter}{Tab}{Escape}');

    expect(activeName()).toBe('teams');
    expect(isMenuOpen()).toBe(false);
    expect(calls).toEqual([]);
    await userEvent.keyboard('{ArrowDown}');
    expect(checkedLabels()).toEqual(['Design']);
  });

  test('Enter and Space on the footer do not toggle an option', async () => {
    const { calls } = await setup({ initial: ['design'], portal });
    await input().click();
    // Opening highlights the first option; two steps down is Engineering.
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}{Tab}{Tab}{Enter}');
    expect(calls).toEqual([['design', 'engineering']]);

    await userEvent.keyboard('{ArrowDown}{Tab}{ }');
    expect(calls).toEqual([['design', 'engineering'], []]);
    expect(checkedLabels()).toEqual([]);
  });

  test('Tab leaves at once when the footer is disabled', async () => {
    await setup({ portal });
    await input().click();
    await userEvent.keyboard('{Tab}');
    expect(activeName()).toBe('After');
    expect(isMenuOpen()).toBe(false);
  });
});

describe('tags on one row', () => {
  const all = teams.map((team) => team.value);

  test.each([560, 400, 260])('fit at %ipx', async (width) => {
    await setup({ initial: all, width });
    await nextFrames();

    const control = document.querySelector('.ms__value-container');
    const tags = [
      ...document.querySelectorAll(
        '.ms__value-container > .ms__multi-value, .ms__value-container > .multiselect-more',
      ),
    ];
    const rows = new Set(
      tags.map((tag) => Math.round(tag.getBoundingClientRect().top)),
    );
    const shown = visibleTags().length;

    expect(shown).toBeGreaterThanOrEqual(1);
    expect(counterText()).toBe(`+${all.length - shown}`);
    expect(rows.size).toBe(1);
    expect(control!.scrollWidth).toBeLessThanOrEqual(control!.clientWidth + 1);
  });

  test('re-measures when the container narrows', async () => {
    await setup({ initial: all, width: 560 });
    await nextFrames();
    const atWide = visibleTags().length;

    document.querySelector<HTMLElement>('form > div')!.style.width = '300px';
    await expect.poll(() => visibleTags().length).toBeLessThan(atWide);
    expect(counterText()).toBe(`+${all.length - visibleTags().length}`);
  });

  test('maxVisibleTags caps the visible tags', async () => {
    await setup({ initial: all, width: 900, maxVisibleTags: 2 });
    await nextFrames();
    expect(visibleTags()).toEqual(['Customer Success', 'Design']);
    expect(counterText()).toBe(`+${all.length - 2}`);
  });

  test('+N is announced and every value is in the description', async () => {
    await setup({ initial: all, width: 300, ariaDescribedBy: 'help' });
    await nextFrames();

    const hidden = all.length - visibleTags().length;
    expect(
      document.querySelector('.ms__value-container > .multiselect-more')
        ?.textContent,
    ).toContain(`${hidden} more selected options`);

    const ids = document
      .getElementById('teams')!
      .getAttribute('aria-describedby')!
      .split(' ');
    expect(ids[0]).toBe('help');
    expect(document.getElementById(ids.at(-1)!)?.textContent).toBe(
      `Selected: ${teams.map((team) => team.label).join(', ')}.`,
    );
  });

  test('hovering +N lists the hidden values; Escape closes it', async () => {
    await setup({ initial: all, width: 400 });
    await nextFrames();
    const counter = document.querySelector<HTMLElement>(
      '.ms__value-container > .multiselect-more',
    )!;

    await page.elementLocator(counter).hover();
    await expect
      .poll(() => document.querySelector('.multiselect-tooltip'))
      .not.toBeNull();

    const shown = visibleTags().length;
    expect(
      [...document.querySelectorAll('.multiselect-tooltip li')].map(
        (item) => item.textContent,
      ),
    ).toEqual(teams.slice(shown).map((team) => team.label));
    expect(
      document
        .querySelector('.multiselect-tooltip')
        ?.getAttribute('aria-hidden'),
    ).toBe('true');

    await userEvent.keyboard('{Escape}');
    await expect
      .poll(() => document.querySelector('.multiselect-tooltip'))
      .toBeNull();
  });
});

describe('screen reader messages', () => {
  test('describe draft edits with the configured label', async () => {
    await setup({ initial: ['design'], confirmLabel: 'Apply' });
    await input().click();
    expect(liveLog()).toContain('press Tab to reach Reset and Apply');

    await option('Design').click();
    expect(liveLog()).toContain(
      'option Design removed, press Apply to confirm.',
    );
    await option('Legal').click();
    expect(liveLog()).toContain('option Legal added, press Apply to confirm.');
  });

  test('announce apply, reset and discarded changes', async () => {
    await setup({ initial: ['design'] });
    await input().click();
    await option('Legal').click();
    await button('OK').click();
    expect(statusText()).toBe('Selection applied: Design, Legal.');

    await input().click();
    await button('Reset').click();
    expect(statusText()).toBe('Selection cleared.');

    await option('Finance').click();
    await userEvent.keyboard('{Escape}');
    expect(statusText()).toBe('Changes discarded.');
  });

  test('closing an unchanged draft announces nothing new', async () => {
    await setup({ initial: ['design'] });
    await input().click();
    await userEvent.keyboard('{Escape}');
    expect(statusText()).toBe('');
  });

  test('ariaDescribedBy is linked before the built-in descriptions', async () => {
    await setup({ ariaDescribedBy: 'teams-help' });
    expect(
      document.getElementById('teams')?.getAttribute('aria-describedby'),
    ).toMatch(/^teams-help /);
  });

  test('the input declares a listbox popup', async () => {
    await setup();
    await expect.element(input()).toHaveAttribute('aria-haspopup', 'listbox');
  });
});
