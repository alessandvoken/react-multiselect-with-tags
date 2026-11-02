import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MultiSelect, type MultiSelectOption } from './MultiSelect';

const teams: MultiSelectOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'finance', label: 'Finance' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
];

function Demo() {
  const [values, setValues] = useState<string[]>([]);

  const [valuesCounter, setValuesCounter] = useState(0);

  return (
    <>
      <h1>React multiselect with tags</h1>
      <label htmlFor="teams">Teams</label>
      <MultiSelect
        inputId="teams"
        options={teams}
        placeholder="Select teams"
        values={values}
        onChange={(nextValues) => {
          setValues(nextValues);
          setValuesCounter((prev) => prev + 1);
        }}
      />

      <p>Applied: {values.length > 0 ? values.join(', ') : 'None'}</p>
      <p>onChange calls: {valuesCounter}</p>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo></Demo>
  </StrictMode>,
);
