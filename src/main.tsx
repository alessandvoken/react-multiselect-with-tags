import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { MultiSelect, type MultiSelectOption } from './MultiSelect';

import './demo.css';

const teams: MultiSelectOption[] = [
  { value: 'customer-success', label: 'Customer Success' },
  { value: 'design', label: 'Design' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'finance', label: 'Finance' },
  { value: 'legal', label: 'Legal' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'people', label: 'People' },
  { value: 'product', label: 'Product' },
  { value: 'research-and-development', label: 'Research and Development' },
  { value: 'sales', label: 'Sales' },
  { value: 'sales-operations', label: 'Sales Operations' },
];

function Demo() {
  const [values, setValues] = useState<string[]>([]);

  const [valuesCounter, setValuesCounter] = useState(0);

  const [isDisabled, setIsDisabled] = useState(false);

  // Portal host inside <main>, so the menu stays in the page landmark.
  const [menuHost, setMenuHost] = useState<HTMLDivElement | null>(null);

  const appliedLabels = teams
    .filter((team) => values.includes(team.value))
    .map((team) => team.label);

  return (
    <main className="demo">
      <header className="demo-header">
        <p className="demo-eyebrow">Component preview</p>
        <h1>React multiselect with tags</h1>
        <p>
          Tick several teams, then press OK to apply the filter once. Close the
          menu without OK and the draft is discarded.
        </p>
        <p className="demo-links">
          <a href="https://github.com/alessandvoken/react-multiselect-with-tags">
            Source on GitHub
          </a>
          <span aria-hidden="true">·</span>
          <span>
            Built on <a href="https://react-select.com/">react-select</a>
          </span>
        </p>
      </header>
      <section className="demo-card" aria-labelledby="filter-title">
        <h2 id="filter-title">Filter</h2>
        {/* Above the field, so the open menu never covers it. */}
        <dl className="demo-summary">
          <div>
            <dt>Applied</dt>
            <dd>
              {appliedLabels.length > 0 ? appliedLabels.join(', ') : 'None'}
            </dd>
          </div>
          <div>
            <dt>Updates</dt>
            <dd>{valuesCounter}</dd>
          </div>
        </dl>
        <label className="demo-label" htmlFor="teams">
          Teams
        </label>
        <MultiSelect
          inputId="teams"
          menuPortalTarget={menuHost}
          options={teams}
          placeholder="Select teams"
          ariaDescribedBy="teams-help"
          disabled={isDisabled}
          values={values}
          onChange={(nextValues) => {
            setValues(nextValues);
            setValuesCounter((prev) => prev + 1);
          }}
        />
        <p id="teams-help" className="demo-help">
          Updates counts each call to onChange: it changes on OK, Reset or tag
          removal, never while ticking options.
        </p>
        <label className="demo-toggle">
          <input
            type="checkbox"
            checked={isDisabled}
            onChange={(event) => setIsDisabled(event.target.checked)}
          />
          Disabled
        </label>
      </section>
      <div ref={setMenuHost} />
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Demo></Demo>
  </StrictMode>,
);
