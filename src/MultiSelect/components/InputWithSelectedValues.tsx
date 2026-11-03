import { components, type InputProps } from 'react-select';

import { useMultiSelectContext } from '../context';
import { selectedValuesId } from '../dom';
import type { MultiSelectOption } from '../types';

// Adds the full list of confirmed values to the input's accessible
// description, so values hidden behind +N are not reachable only by hover.
export function InputWithSelectedValues(
  props: InputProps<MultiSelectOption, true>,
) {
  const { ariaDescribedBy } = useMultiSelectContext();
  // Consumer help or error text first, then react-select's own description,
  // then the list of confirmed values.
  const describedBy = [
    ariaDescribedBy,
    props['aria-describedby'],
    props.hasValue && selectedValuesId(props.selectProps.inputId),
  ]
    .filter(Boolean)
    .join(' ');

  // react-select sets aria-haspopup="true", which means a menu; the popup here
  // is a listbox.
  return (
    <components.Input
      {...props}
      aria-haspopup="listbox"
      aria-describedby={describedBy || undefined}
    />
  );
}
