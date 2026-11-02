import { createContext, useContext, type ReactNode } from 'react';
import { components, type MenuProps } from 'react-select';

import type { MultiSelectOption } from './MultiSelect';

export type MenuFooterValue = {
  resetLabel: string;
  confirmLabel: string;
  isDisabled: boolean;
  onReset: () => void;
  onConfirm: () => void;
};

// react-select does not forward extra props to custom components, so the
// footer reads draft-related state and handlers from MultiSelect via context.
const MenuFooterContext = createContext<MenuFooterValue | null>(null);

export function MenuFooterProvider({
  value,
  children,
}: {
  value: MenuFooterValue;
  children: ReactNode;
}) {
  return (
    <MenuFooterContext.Provider value={value}>
      {children}
    </MenuFooterContext.Provider>
  );
}

export function MenuSelect({
  children,
  ...rest
}: MenuProps<MultiSelectOption, true>) {
  const footer = useContext(MenuFooterContext);
  if (!footer) {
    throw new Error('MenuSelect must be rendered inside MultiSelect');
  }

  return (
    <components.Menu {...rest}>
      {children}
      <fieldset className="multiselect-footer" aria-label="Selection actions">
        <button
          type="button"
          disabled={footer.isDisabled}
          onClick={footer.onReset}
        >
          {footer.resetLabel}
        </button>
        <button
          type="button"
          className="multiselect-confirm"
          disabled={footer.isDisabled}
          onClick={footer.onConfirm}
        >
          {footer.confirmLabel}
        </button>
      </fieldset>
    </components.Menu>
  );
}
