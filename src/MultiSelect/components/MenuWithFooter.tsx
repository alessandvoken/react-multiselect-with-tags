import type { FocusEvent, KeyboardEvent } from 'react';
import { components, type MenuProps } from 'react-select';

import { useMultiSelectContext } from '../context';
import type { MultiSelectOption } from '../types';

// The menu with a Reset / OK group below the listbox, outside role="listbox".
export function MenuWithFooter({
  children,
  ...rest
}: MenuProps<MultiSelectOption, true>) {
  const {
    resetLabel,
    confirmLabel,
    isFooterDisabled,
    onReset,
    onConfirm,
    footerRef,
    inputRef,
    onFocusInput,
    onDismiss,
    onCloseMenu,
    onTabOut,
  } = useMultiSelectContext();

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    // react-select listens for keys on its container: without this, Enter or
    // Space on a button would also toggle the focused option.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== 'Tab') return;
    // Explicit, so it also works when the menu is portalled elsewhere in the
    // DOM: Shift+Tab from the first button returns to the input, Tab from the
    // last one continues after the component.
    const buttons = [
      ...(footerRef.current?.querySelectorAll('button:enabled') ?? []),
    ];
    if (event.shiftKey && event.currentTarget === buttons[0]) {
      event.preventDefault();
      onFocusInput();
    } else if (!event.shiftKey && event.currentTarget === buttons.at(-1)) {
      if (onTabOut()) event.preventDefault();
    }
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && footerRef.current?.contains(next)) return;
    if (next === inputRef()) return;
    // Focus left the component from the footer: close and discard the draft.
    onCloseMenu();
  }

  return (
    <components.Menu {...rest}>
      {children}
      <fieldset
        ref={footerRef}
        className="multiselect-footer"
        aria-label="Selection actions"
      >
        <button
          type="button"
          disabled={isFooterDisabled}
          onClick={onReset}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        >
          {resetLabel}
        </button>
        <button
          type="button"
          className="multiselect-confirm"
          disabled={isFooterDisabled}
          onClick={onConfirm}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        >
          {confirmLabel}
        </button>
      </fieldset>
    </components.Menu>
  );
}
