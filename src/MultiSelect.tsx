import Select, { type StylesConfig, type ThemeConfig } from 'react-select';

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
  const selectedOptions = options.filter((option) =>
    values.includes(option.value),
  );

  return (
    <Select
      isMulti
      inputId={inputId}
      aria-labelledby={ariaLabelledBy}
      options={options}
      value={selectedOptions}
      onChange={(selected) => onChange(selected.map((option) => option.value))}
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
    />
  );
}
