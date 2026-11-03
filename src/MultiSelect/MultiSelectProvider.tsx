import type { ReactNode } from 'react';

import { MultiSelectContext, type MultiSelectContextValue } from './context';

export function MultiSelectProvider({
  value,
  children,
}: {
  value: MultiSelectContextValue;
  children: ReactNode;
}) {
  return (
    <MultiSelectContext.Provider value={value}>
      {children}
    </MultiSelectContext.Provider>
  );
}
