import { useState } from 'react';
import type { ActionMeta, MultiValue } from 'react-select';

import type { MultiSelectOption } from './types';

// The menu edits a copy of the applied values. Ticking options changes only
// the copy; removing a tag or Reset applies at once; OK applies the copy.
export function useDraft(
  values: readonly string[],
  onChange: (values: string[]) => void,
) {
  const [draft, setDraft] = useState<string[]>([]);

  const isDraftChanged =
    draft.length !== values.length ||
    draft.some((value) => !values.includes(value));

  // A new array on every open, so external `values` changes are picked up.
  function startDraft() {
    setDraft([...values]);
  }

  function isInDraft(option: MultiSelectOption) {
    return draft.includes(option.value);
  }

  function reset() {
    setDraft([]);
    if (values.length > 0) onChange([]);
  }

  function apply() {
    if (isDraftChanged) onChange([...draft]);
  }

  function handleChange(
    newValue: MultiValue<MultiSelectOption>,
    actionMeta: ActionMeta<MultiSelectOption>,
  ) {
    switch (actionMeta.action) {
      case 'select-option': {
        const { option } = actionMeta;
        if (!option) return;
        setDraft((prevDraft) => [...prevDraft, option.value]);
        break;
      }
      case 'deselect-option': {
        const { option } = actionMeta;
        if (!option) return;
        setDraft((prevDraft) =>
          prevDraft.filter((value) => value !== option.value),
        );
        break;
      }
      // Tag × and Backspace act on applied values: `newValue` is derived from
      // them, so it is safe to apply directly.
      case 'remove-value':
      case 'pop-value': {
        const { removedValue } = actionMeta;
        onChange(newValue.map((option) => option.value));
        setDraft((prevDraft) =>
          prevDraft.filter((value) => value !== removedValue.value),
        );
        break;
      }
      case 'clear': {
        onChange([]);
        setDraft([]);
        break;
      }
    }
  }

  return {
    draft,
    isDraftChanged,
    startDraft,
    isInDraft,
    reset,
    apply,
    handleChange,
  };
}
