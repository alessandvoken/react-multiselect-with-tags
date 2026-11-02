import { useState } from 'react';
import Select, {
  type ActionMeta,
  type MultiValue,
  type StylesConfig,
  type ThemeConfig,
} from 'react-select';

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

export function MultiSelect({
  inputId,
  values,
  options,
  onChange,
  ariaLabelledBy,
  placeholder = 'Select options',
  disabled = false,
  isSearchable = true,
  theme,
  styles,
  className,
  classNamePrefix,
  menuPortalTarget,
}: MultiSelectProps) {
  const [openMenu, setOpenMenu] = useState(false);

  const [draft, setDraft] = useState<string[]>([]);

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
    setOpenMenu(false);
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
    <Select
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
      styles={styles}
      className={className}
      classNamePrefix={classNamePrefix}
      menuPortalTarget={menuPortalTarget}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      menuIsOpen={openMenu}
      onMenuOpen={handleMenuOpen}
      onMenuClose={handleMenuClose}
      isOptionSelected={isInDraft}
    />
  );
}
