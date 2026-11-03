import type { StylesConfig } from 'react-select';

import { INPUT_MIN_WIDTH } from './dom';
import type { MultiSelectOption } from './types';

// Defaults merged under the consumer's `styles`, which always win.
export const defaultStyles: StylesConfig<MultiSelectOption, true> = {
  // react-select hides the outline and shows focus with a box-shadow, which
  // forced-colors mode removes: draw a system-color outline there instead.
  control: (base, { isFocused }) => ({
    ...base,
    outline: 0,
    '@media (forced-colors: active)': isFocused
      ? { outline: '2px solid Highlight', outlineOffset: 2 }
      : {},
  }),
  // neutral60 (#666) reaches 5.7:1 on white; the default neutral50 is 3.9:1.
  placeholder: (base, { theme }) => ({
    ...base,
    color: theme.colors.neutral60,
  }),
  // Tags stay on one row (see TagsValueContainer) with room for the input.
  valueContainer: (base) => ({ ...base, flexWrap: 'nowrap' }),
  input: (base) => ({ ...base, minWidth: INPUT_MIN_WIDTH }),
  // Room for a few characters plus the remove button, so the last visible tag
  // truncates with an ellipsis instead of shrinking away.
  multiValue: (base) => ({ ...base, minWidth: '4.5em' }),
  // The checkbox shows the selection, so selected options drop react-select's
  // solid primary background and keep only the focus highlight.
  option: (base, { isDisabled, isFocused, theme }) => ({
    ...base,
    backgroundColor: isFocused ? theme.colors.primary25 : 'transparent',
    color: isDisabled ? theme.colors.neutral20 : 'inherit',
    ':active': {
      backgroundColor: isDisabled ? undefined : theme.colors.primary50,
    },
  }),
};
