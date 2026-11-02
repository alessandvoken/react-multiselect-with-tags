import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MultiSelect, type MultiSelectOption } from './MultiSelect';

import './demo.css';

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

  const appliedLabels = teams
    .filter((team) => values.includes(team.value))
    .map((team) => team.label);

  return (
    <main className="demo">
      <header>
        <h1>React multiselect with tags</h1>
        <p>
          Select several teams, then press OK to apply the filter once. Closing
          the menu without OK discards the draft.
        </p>
      </header>
      <section className="demo-card" aria-labelledby="filter-title">
        <h2 id="filter-title">Filter</h2>
        <label className="demo-label" htmlFor="teams">
          Teams
        </label>
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
      </section>

      <section className="demo-result" aria-labelledby="applied-filter-title">
        <h2 id="applied-filter-title">Applied filter</h2>
        <p>
          Applied:{' '}
          {appliedLabels.length > 0 ? appliedLabels.join(', ') : 'None'}
        </p>
        <p>onChange calls: {valuesCounter}</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo></Demo>
  </StrictMode>,
);
