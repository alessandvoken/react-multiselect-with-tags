import { useRef, useState } from 'react';
import Select, { mergeStyles, type SelectInstance } from 'react-select';

import { createAriaLiveMessages } from './ariaMessages';
import { InputWithSelectedValues } from './components/InputWithSelectedValues';
import { MenuWithFooter } from './components/MenuWithFooter';
import { OptionWithCheckbox } from './components/OptionWithCheckbox';
import { TagsValueContainer } from './components/TagsValueContainer';
import { MultiSelectProvider } from './MultiSelectProvider';
import { defaultStyles } from './styles';
import type { MultiSelectOption, MultiSelectProps } from './types';
import { useAnnouncer } from './useAnnouncer';
import { useDraft } from './useDraft';
import { useFooterFocus } from './useFooterFocus';

import './MultiSelect.css';

// Defined once: a new object each render would remount these components.
const customComponents = {
  Input: InputWithSelectedValues,
  Menu: MenuWithFooter,
  Option: OptionWithCheckbox,
  ValueContainer: TagsValueContainer,
};

export function MultiSelect({
  inputId,
  values,
  options,
  onChange,
  ariaLabelledBy,
  ariaDescribedBy,
  placeholder = 'Select options',
  maxVisibleTags,
  disabled = false,
  isSearchable = true,
  resetLabel = 'Reset',
  confirmLabel = 'OK',
  theme,
  styles,
  className,
  classNamePrefix,
  menuPortalTarget,
}: MultiSelectProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selectRef = useRef<SelectInstance<MultiSelectOption, true>>(null);
  const { status, announce } = useAnnouncer();
  const draft = useDraft(values, onChange);

  // Every way of closing except OK: Escape, click outside, Tab away.
  function closeWithoutApplying() {
    if (isMenuOpen && draft.isDraftChanged) announce('Changes discarded.');
    setIsMenuOpen(false);
  }

  const footerFocus = useFooterFocus({
    selectRef,
    isMenuOpen,
    onClose: closeWithoutApplying,
  });

  // Copies, not the original objects: react-select treats any option found in
  // `value` by reference as selected and never asks isOptionSelected.
  const selectedOptions = options
    .filter((option) => values.includes(option.value))
    .map((option) => ({ ...option }));

  function handleMenuOpen() {
    draft.startDraft();
    setIsMenuOpen(true);
  }

  function dismissMenu() {
    footerFocus.focusInput();
    closeWithoutApplying();
  }

  function handleReset() {
    draft.reset();
    announce('Selection cleared.');
    footerFocus.focusInput();
  }

  function handleConfirm() {
    draft.apply();
    const labels = options
      .filter((option) => draft.isInDraft(option))
      .map((option) => option.label);
    announce(
      labels.length > 0
        ? `Selection applied: ${labels.join(', ')}.`
        : 'Selection applied: none.',
    );
    setIsMenuOpen(false);
    footerFocus.focusInput();
  }

  return (
    <MultiSelectProvider
      value={{
        resetLabel,
        confirmLabel,
        isFooterDisabled: draft.draft.length === 0 && values.length === 0,
        onReset: handleReset,
        onConfirm: handleConfirm,
        maxVisibleTags,
        ariaDescribedBy,
        footerRef: footerFocus.footerRef,
        inputRef: () => selectRef.current?.inputRef ?? null,
        onFocusInput: footerFocus.focusInput,
        onDismiss: dismissMenu,
        onCloseMenu: closeWithoutApplying,
        onTabOut: footerFocus.tabOutOfFooter,
      }}
    >
      <Select
        ref={selectRef}
        isMulti
        inputId={inputId}
        aria-labelledby={ariaLabelledBy}
        options={options}
        value={selectedOptions}
        onChange={draft.handleChange}
        placeholder={placeholder}
        isDisabled={disabled}
        isSearchable={isSearchable}
        theme={theme}
        styles={mergeStyles(defaultStyles, styles)}
        className={className}
        classNamePrefix={classNamePrefix}
        menuPortalTarget={menuPortalTarget}
        closeMenuOnSelect={false}
        hideSelectedOptions={false}
        menuIsOpen={isMenuOpen}
        onMenuOpen={handleMenuOpen}
        onMenuClose={footerFocus.handleMenuClose}
        onBlur={footerFocus.handleBlur}
        onKeyDown={footerFocus.handleKeyDown}
        tabSelectsValue={false}
        ariaLiveMessages={createAriaLiveMessages({
          resetLabel,
          confirmLabel,
          isInDraft: draft.isInDraft,
        })}
        isOptionSelected={draft.isInDraft}
        components={customComponents}
      />
      {/* <output> has the implicit status role; aria-live is explicit for
          screen readers that do not map it. */}
      <output className="multiselect-visually-hidden" aria-live="polite">
        {status}
      </output>
    </MultiSelectProvider>
  );
}
