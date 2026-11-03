import {
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type RefObject,
} from 'react';
import type { SelectInstance } from 'react-select';

import { nextTabbableAfter } from './dom';
import type { MultiSelectOption } from './types';

// Keyboard path between the input and the Reset / OK footer, inline or in a
// portal: Tab from the input reaches the footer, the menu stays open while
// focus moves there, and Tab from OK leaves the component.
export function useFooterFocus({
  selectRef,
  isMenuOpen,
  onClose,
}: {
  selectRef: RefObject<SelectInstance<MultiSelectOption, true> | null>;
  isMenuOpen: boolean;
  onClose: () => void;
}) {
  const footerRef = useRef<HTMLFieldSetElement>(null);

  // Set when the input loses focus to the footer, so the menu stays open.
  const isMovingToFooterRef = useRef(false);

  function focusInput() {
    selectRef.current?.focus();
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const next = event.relatedTarget;
    isMovingToFooterRef.current =
      next instanceof Node && (footerRef.current?.contains(next) ?? false);
  }

  // react-select closes the menu on input blur; skip that one when focus went
  // to the footer.
  function handleMenuClose() {
    if (isMovingToFooterRef.current) {
      isMovingToFooterRef.current = false;
      return;
    }
    onClose();
  }

  // Tab from the input moves to the footer instead of selecting the focused
  // option; with both buttons disabled it leaves the component as usual.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || event.shiftKey || !isMenuOpen) return;
    const firstButton =
      footerRef.current?.querySelector<HTMLButtonElement>('button:enabled');
    if (!firstButton) return;
    event.preventDefault();
    firstButton.focus();
  }

  // With an inline menu the browser already tabs from OK to the next element.
  // A portalled menu sits elsewhere in the DOM, so focus is moved explicitly.
  function tabOutOfFooter() {
    const container = selectRef.current?.controlRef?.parentElement;
    const footer = footerRef.current;
    if (!container || !footer || container.contains(footer)) return false;
    const next = nextTabbableAfter(container);
    if (!next) return false;
    next.focus();
    return true;
  }

  return {
    footerRef,
    focusInput,
    handleBlur,
    handleMenuClose,
    handleKeyDown,
    tabOutOfFooter,
  };
}
