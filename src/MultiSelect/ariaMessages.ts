import type { AriaLiveMessages, GroupBase } from 'react-select';

import type { MultiSelectOption } from './types';

// react-select's default messages describe the confirmed value. Here the menu
// edits a draft, so messages say what is provisional and name the footer
// actions with their actual labels.
export function createAriaLiveMessages({
  resetLabel,
  confirmLabel,
  isInDraft,
}: {
  resetLabel: string;
  confirmLabel: string;
  isInDraft: (option: MultiSelectOption) => boolean;
}): AriaLiveMessages<MultiSelectOption, true, GroupBase<MultiSelectOption>> {
  return {
    guidance: ({ context, isSearchable }) => {
      switch (context) {
        case 'menu':
          return `Use Up and Down to choose options, press Enter to add or remove the focused option, press Tab to reach ${resetLabel} and ${confirmLabel}, press ${confirmLabel} to confirm, press Escape to close without applying.`;
        case 'input':
          return `${isSearchable ? 'Type to refine list, ' : ''}press Down to open the menu, press Left to focus selected values.`;
        case 'value':
          return 'Use Left and Right to move between selected values, press Backspace to remove the focused value.';
        default:
          return '';
      }
    },
    onChange: ({ action, label, labels }) => {
      switch (action) {
        case 'select-option':
          return `option ${label} added, press ${confirmLabel} to confirm.`;
        case 'deselect-option':
          return `option ${label} removed, press ${confirmLabel} to confirm.`;
        case 'remove-value':
        case 'pop-value':
          return `option ${label} removed from the applied selection.`;
        case 'clear':
          return 'All selected options have been cleared.';
        case 'initial-input-focus':
          return `option${labels.length > 1 ? 's' : ''} ${labels.join(', ')}, selected.`;
        default:
          return '';
      }
    },
    onFocus: ({
      context,
      focused,
      label,
      options,
      isDisabled,
      isAppleDevice,
    }) => {
      const position = `${options.indexOf(focused) + 1} of ${options.length}`;
      if (context === 'value') return `value ${label} focused, ${position}.`;
      // Elsewhere aria-activedescendant points at the option, whose
      // aria-selected already follows the draft.
      if (!isAppleDevice) return '';
      const state = [isInDraft(focused) && 'selected', isDisabled && 'disabled']
        .filter(Boolean)
        .join(' ');
      return `${label}${state ? ` ${state}` : ''}, ${position}.`;
    },
  };
}
