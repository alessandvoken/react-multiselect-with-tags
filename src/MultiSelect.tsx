import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import Select, {
  type ActionMeta,
  type AriaLiveMessages,
  type GroupBase,
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
  ariaDescribedBy?: string;
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
  const [openMenu, setOpenMenu] = useState(false);

  const [draft, setDraft] = useState<string[]>([]);

  const selectRef = useRef<SelectInstance<MultiSelectOption, true>>(null);

  const footerRef = useRef<HTMLFieldSetElement>(null);

  // Polite status for what react-select does not announce: apply, reset and
  // discarded changes. A trailing no-break space alternates so that the same
  // message twice in a row is still announced.
  const [status, setStatus] = useState('');
  function announce(message: string) {
    setStatus((prev) => (prev === message ? `${message}\u00a0` : message));
  }

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

  const isDraftChanged =
    draft.length !== values.length ||
    draft.some((value) => !values.includes(value));

  function labelsOf(selectedValues: readonly string[]) {
    return options
      .filter((option) => selectedValues.includes(option.value))
      .map((option) => option.label);
  }

  // Every way of closing except OK: Escape, click outside, Tab away.
  function closeWithoutApplying() {
    if (openMenu && isDraftChanged) announce('Changes discarded.');
    setOpenMenu(false);
  }

  function handleMenuClose() {
    if (isMovingToFooterRef.current) {
      isMovingToFooterRef.current = false;
      return;
    }
    closeWithoutApplying();
  }

  function focusInput() {
    selectRef.current?.focus();
  }

  function dismissMenu() {
    focusInput();
    closeWithoutApplying();
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
    announce('Selection cleared.');
    focusInput();
  }

  function handleConfirm() {
    if (isDraftChanged) onChange([...draft]);
    const labels = labelsOf(draft);
    announce(
      labels.length > 0
        ? `Selection applied: ${labels.join(', ')}.`
        : 'Selection applied: none.',
    );
    setOpenMenu(false);
    focusInput();
  }

  // react-select's default messages describe the confirmed value. Here the
  // menu edits a draft, so messages say what is provisional and name the
  // footer actions with their actual labels.
  const ariaLiveMessages: AriaLiveMessages<
    MultiSelectOption,
    true,
    GroupBase<MultiSelectOption>
  > = {
    guidance: ({ context, isSearchable: searchable }) => {
      switch (context) {
        case 'menu':
          return `Use Up and Down to choose options, press Enter to add or remove the focused option, press Tab to reach ${resetLabel} and ${confirmLabel}, press ${confirmLabel} to confirm, press Escape to close without applying.`;
        case 'input':
          return `${searchable ? 'Type to refine list, ' : ''}press Down to open the menu, press Left to focus selected values.`;
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
      options: focusable,
      isDisabled,
      isAppleDevice,
    }) => {
      const position = `${focusable.indexOf(focused) + 1} of ${focusable.length}`;
      if (context === 'value') return `value ${label} focused, ${position}.`;
      // Elsewhere aria-activedescendant points at the option, whose
      // aria-selected already follows the draft.
      if (!isAppleDevice) return '';
      const state = [
        draft.includes(focused.value) && 'selected',
        isDisabled && 'disabled',
      ]
        .filter(Boolean)
        .join(' ');
      return `${label}${state ? ` ${state}` : ''}, ${position}.`;
    },
  };

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
        ariaDescribedBy,
        footerRef,
        inputRef: () => selectRef.current?.inputRef ?? null,
        onFocusInput: focusInput,
        onDismiss: dismissMenu,
        onCloseMenu: closeWithoutApplying,
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
        ariaLiveMessages={ariaLiveMessages}
        isOptionSelected={isInDraft}
        components={{
          Input: InputWithSelectedValues,
          Menu: MenuSelect,
          Option: OptionWithCheckbox,
          ValueContainer: TagsValueContainer,
        }}
      />
      {/* <output> has the implicit status role; aria-live is explicit for
          screen readers that do not map it. */}
      <output className="multiselect-visually-hidden" aria-live="polite">
        {status}
      </output>
    </MultiSelectProvider>
  );
}
