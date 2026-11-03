# React multiselect with tags, checkboxes and an OK button

A searchable React multi-select with checkbox options, removable tags on one row and a Reset / OK footer. Built on [react-select](https://react-select.com/).

Pick several options, then press **OK** to apply them in one go. Close the menu instead and the draft is discarded.

> **Work in progress.** No live preview or package yet.

## Why

A filter that refetches on every checkbox sends one request per click. Here the menu edits a draft, and the parent's `onChange` runs once, when the user presses OK.

## Behaviour

| Action                          | Result                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Open the menu                   | The draft starts from the applied values                                                                       |
| Tick or untick an option        | Changes the draft only: tags and `onChange` stay untouched                                                     |
| OK                              | Applies the draft, closes the menu, returns focus to the input. Calls `onChange` only if the selection changed |
| Escape, click outside, Tab away | Closes the menu and discards the draft                                                                         |
| Reset                           | Clears the applied values immediately; the menu stays open                                                     |
| Remove a tag (× or Backspace)   | Applies immediately, no OK needed                                                                              |

Reset and OK are disabled when both the draft and the applied values are empty. If applied values remain, OK can apply an empty selection.

## Tags and +N

Applied values appear as tags on a single row. As many as fit are shown and the rest are counted in `+N`, re-measured when the width, zoom or font changes. Hover `+N` to list the hidden values. `maxVisibleTags` sets an upper limit.

## Keyboard

- Arrow keys move through the options; Enter toggles the highlighted one.
- Tab from the input moves to Reset, then OK; Tab from OK leaves the component. Shift+Tab from Reset returns to the input.
- Escape closes without applying, from the input or the footer.
- Enter or Space on a footer button never toggles an option as well.

## Accessibility

- Options use `role="option"` with `aria-selected` following the draft. The checkbox is drawn, not an `<input>`, so there is no interactive control nested in an option.
- Screen reader messages describe draft edits and announce apply, reset and discarded changes, using your button labels.
- All applied values, including those behind `+N`, are part of the input's accessible description.
- Focus stays visible in forced-colors mode; the placeholder has 5.7:1 contrast.

Checked so far in headless Chromium with keyboard and DOM assertions. Not done yet: tests in the repository, automated axe runs, VoiceOver and NVDA sessions, 200–400% zoom.

Deliberate trade-off: OK keeps react-select's default blue (`#2684FF`), so its white text is about 3.6:1, below the 4.5:1 required for normal text. If you need WCAG AA, set `--multiselect-primary` to a darker blue, such as `#0052CC`.

## Usage

1. **Install react-select.**

   ```sh
   npm install react-select
   ```

2. **Copy the component.** Copy the `src/MultiSelect/` folder into your project, for example to `src/components/MultiSelect/`.

3. **Check the CSS import.** `MultiSelect.tsx` imports `./MultiSelect.css`. Vite, Next.js (App Router) and webpack with a CSS loader handle this as is. If your setup can't import CSS from a component, delete that line and load the file with your global styles.

   With the Next.js App Router, also add `'use client';` at the top of `MultiSelect.tsx`.

4. **Render it with a label.** The parent keeps the applied values in state:

   ```tsx
   import { useState } from 'react';

   import { MultiSelect } from './components/MultiSelect';

   const teams = [
     { value: 'design', label: 'Design' },
     { value: 'engineering', label: 'Engineering' },
   ];

   export function TeamFilter() {
     const [selected, setSelected] = useState<string[]>([]);

     return (
       <>
         <label htmlFor="teams">Teams</label>
         <MultiSelect
           inputId="teams"
           options={teams}
           values={selected}
           onChange={setSelected}
         />
       </>
     );
   }
   ```

5. **React to changes in `onChange`.** It runs once per OK, Reset, clear (×) or tag removal, never while ticking options, so it's the place to refetch or filter.

6. **Optional.** Rename the buttons with `resetLabel` / `confirmLabel`, link help text with `ariaDescribedBy`, and match your colours with `theme`, `styles` and the CSS variables below.

Written against React 19 and react-select 5.10 without React 19-only APIs. React 18 has not been tested yet.

## Props

| Prop                           | Default          | Purpose                                                                |
| ------------------------------ | ---------------- | ---------------------------------------------------------------------- |
| `inputId`                      | required         | ID of the input; connect a `<label htmlFor>` to it                     |
| `options`                      | required         | `{ value: string; label: string }[]`                                   |
| `values`                       | required         | Applied values, owned by the parent                                    |
| `onChange`                     | required         | Receives the new applied values                                        |
| `ariaLabelledBy`               | —                | ID of the label, if you don't use `htmlFor`                            |
| `ariaDescribedBy`              | —                | IDs of your help or error text                                         |
| `placeholder`                  | `Select options` | Shown when nothing is applied                                          |
| `maxVisibleTags`               | —                | Upper limit for visible tags                                           |
| `disabled`                     | `false`          | Disables the whole control                                             |
| `isSearchable`                 | `true`           | `false` turns off typing, keeps selection and keyboard                 |
| `resetLabel`                   | `Reset`          | Text and accessible name of Reset                                      |
| `confirmLabel`                 | `OK`             | Text and accessible name of OK                                         |
| `theme`, `styles`              | —                | react-select styling; your values win over the defaults                |
| `className`, `classNamePrefix` | —                | CSS hooks for the react-select parts                                   |
| `menuPortalTarget`             | —                | Renders the menu in another element, e.g. outside a clipping container |

## Styling

react-select keeps its default theme: adapt it with `theme` and `styles`. The parts added here (footer, checkbox, `+N`, tooltip) are styled by `MultiSelect.css`, with selectors wrapped in `:where()` so any rule of yours wins, `font: inherit` and colours as custom properties:

`--multiselect-primary`, `--multiselect-primary-hover`, `--multiselect-on-primary`, `--multiselect-text`, `--multiselect-surface`, `--multiselect-border`, `--multiselect-hover`, `--multiselect-checkbox-border`, `--multiselect-tag-surface`, `--multiselect-disabled-surface`, `--multiselect-disabled-text`, `--multiselect-tooltip-surface`, `--multiselect-tooltip-text`, `--multiselect-tooltip-border`.

With `menuPortalTarget`, set the variables on an ancestor of the portal host: the menu does not inherit them from the component's wrapper.

## Scope

It selects existing options only: no free-text tags and no data fetching. What happens on `onChange` is up to the parent.

## Development

Node 26.13 (see `.nvmrc`) and pnpm 11.

```sh
pnpm install
pnpm dev        # demo page
pnpm lint
pnpm typecheck
pnpm build
```

## License

[MIT](LICENSE)
