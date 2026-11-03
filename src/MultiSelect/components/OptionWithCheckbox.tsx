import { components, type OptionProps } from 'react-select';

import type { MultiSelectOption } from '../types';

// Visual-only checkbox: a real <input> inside role="option" would be a nested
// interactive control. Selection is exposed by the option itself.
export function OptionWithCheckbox({
  children,
  ...rest
}: OptionProps<MultiSelectOption, true>) {
  const checkboxClassName = [
    'multiselect-checkbox',
    rest.isSelected && 'multiselect-checkbox--checked',
    rest.isDisabled && 'multiselect-checkbox--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <components.Option {...rest}>
      <span className={checkboxClassName} aria-hidden="true" />
      {children}
    </components.Option>
  );
}
