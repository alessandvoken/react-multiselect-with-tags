import { createContext, useContext } from 'react';

export type MultiSelectContextValue = {
  resetLabel: string;
  confirmLabel: string;
  isFooterDisabled: boolean;
  onReset: () => void;
  onConfirm: () => void;
  maxVisibleTags?: number;
  ariaDescribedBy?: string;
  // Structural on purpose: @types/react 18 and 19 disagree on RefObject's
  // nullability, and this shape is accepted as a `ref` by both.
  footerRef: { readonly current: HTMLFieldSetElement | null };
  inputRef: () => HTMLInputElement | null;
  onFocusInput: () => void;
  onDismiss: () => void;
  onCloseMenu: () => void;
  onTabOut: () => boolean;
};

// react-select does not forward extra props to custom components, so they read
// draft-related state and handlers from MultiSelect via context.
export const MultiSelectContext = createContext<MultiSelectContextValue | null>(
  null,
);

export function useMultiSelectContext() {
  const value = useContext(MultiSelectContext);
  if (!value) {
    throw new Error('MultiSelect parts must be rendered inside MultiSelect');
  }
  return value;
}
