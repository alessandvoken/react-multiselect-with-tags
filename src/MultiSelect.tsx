import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import Select, {
  type ActionMeta,
  mergeStyles,
  type MultiValue,
  type SelectInstance,
  type StylesConfig,
  type ThemeConfig,
} from 'react-select';

import {
  INPUT_MIN_WIDTH,
  InputWithSelectedValues,
  MenuSelect,
  MultiSelectProvider,
  OptionWithCheckbox,
  TagsValueContainer,
} from './MenuSelection';

import './MultiSelect.css';

export type MultiSelectOption = { value: string; label: string };

export type MultiSelectProps = {
  inputId: string;
  values: readonly string[];
  options: readonly MultiSelectOption[];
  onChange: (values: string[]) => void;
  ariaLabelledBy?: string;
  placeholder?: string;
  maxVisibleTags?: number;
  disabled?: boolean;
  isSearchable?: boolean;
  resetLabel?: string;
  confirmLabel?: string;
  theme?: ThemeConfig;
  styles?: StylesConfig<MultiSelectOption, true>;
  className?: string;
  classNamePrefix?: string;
  menuPortalTarget?: HTMLElement | null;
};

const defaultStyles: StylesConfig<MultiSelectOption, true> = {
  valueContainer: (base) => ({ ...base, flexWrap: 'nowrap' }),
  input: (base) => ({ ...base, minWidth: INPUT_MIN_WIDTH }),

  multiValue: (base) => ({ ...base, minWidth: '4.5em' }),
  option: (base, { isDisabled, isFocused, theme }) => ({
    ...base,
    backgroundColor: isFocused ? theme.colors.primary25 : 'transparent',
    color: isDisabled ? theme.colors.neutral20 : 'inherit',
    ':active': {
      backgroundColor: isDisabled ? undefined : theme.colors.primary50,
    },
  }),
};

const TABBABLE = [
  'a[href]',
  'button:enabled',
  'input:enabled:not([type="hidden"])',
  'select:enabled',
  'textarea:enabled',
  '[tabindex]',
].join(',');

// First element in tab order after `container`, skipping anything inside it.
function nextTabbableAfter(container: Element) {
  return [...document.querySelectorAll<HTMLElement>(TABBABLE)].find(
    (element) =>
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      !container.contains(element) &&
      (container.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
        0,
  );
}

export function MultiSelect({
  inputId,
  values,
  options,
  onChange,
  ariaLabelledBy,
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
  const [openMenu, setOpenMenu] = useState(false);

  const [draft, setDraft] = useState<string[]>([]);

  const selectRef = useRef<SelectInstance<MultiSelectOption, true>>(null);

  const footerRef = useRef<HTMLFieldSetElement>(null);

  // Set when the input loses focus to the footer, so the menu stays open.
  const isMovingToFooterRef = useRef(false);

  // Copies, not the original objects: react-select treats any option found in
  // `value` by reference as selected and never asks isOptionSelected.
  const selectedOptions = options
    .filter((option) => values.includes(option.value))
    .map((option) => ({ ...option }));

  function isInDraft(option: MultiSelectOption): boolean {
    return draft.includes(option.value);
  }

  function handleMenuOpen() {
    setOpenMenu(true);
    setDraft([...values]);
  }

  function handleMenuClose() {
    if (isMovingToFooterRef.current) {
      isMovingToFooterRef.current = false;
      return;
    }
    setOpenMenu(false);
  }

  function focusInput() {
    selectRef.current?.focus();
  }

  function dismissMenu() {
    focusInput();
    setOpenMenu(false);
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

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    const next = event.relatedTarget;
    isMovingToFooterRef.current =
      next instanceof Node && (footerRef.current?.contains(next) ?? false);
  }

  // Tab from the input moves to the footer instead of selecting the focused
  // option; with both buttons disabled it leaves the component as usual.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Tab' || event.shiftKey || !openMenu) return;
    const firstButton =
      footerRef.current?.querySelector<HTMLButtonElement>('button:enabled');
    if (!firstButton) return;
    event.preventDefault();
    firstButton.focus();
  }

  function handleReset() {
    setDraft([]);
    if (values.length > 0) onChange([]);
    focusInput();
  }

  function handleConfirm() {
    const hasChanged =
      draft.length !== values.length ||
      draft.some((value) => !values.includes(value));
    if (hasChanged) onChange([...draft]);
    setOpenMenu(false);
    selectRef.current?.focus();
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

  return (
    <MultiSelectProvider
      value={{
        resetLabel,
        confirmLabel,
        isFooterDisabled: draft.length === 0 && values.length === 0,
        onReset: handleReset,
        onConfirm: handleConfirm,
        maxVisibleTags,
        footerRef,
        inputRef: () => selectRef.current?.inputRef ?? null,
        onFocusInput: focusInput,
        onDismiss: dismissMenu,
        onCloseMenu: () => setOpenMenu(false),
        onTabOut: tabOutOfFooter,
      }}
    >
      <Select
        ref={selectRef}
        isMulti
        inputId={inputId}
        aria-labelledby={ariaLabelledBy}
        options={options}
        value={selectedOptions}
        onChange={handleChange}
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
        menuIsOpen={openMenu}
        onMenuOpen={handleMenuOpen}
        onMenuClose={handleMenuClose}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        tabSelectsValue={false}
        isOptionSelected={isInDraft}
        components={{
          Input: InputWithSelectedValues,
          Menu: MenuSelect,
          Option: OptionWithCheckbox,
          ValueContainer: TagsValueContainer,
        }}
      />
    </MultiSelectProvider>
  );
}
