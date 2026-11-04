import { StrictMode, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { GitHubIcon } from './GitHubIcon';
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

type Person = { name: string; team: string };

const people: Person[] = [
  { name: 'Amara Okafor', team: 'customer-success' },
  { name: 'Lena Fischer', team: 'design' },
  { name: 'Tomás Herrera', team: 'design' },
  { name: 'Priya Raman', team: 'engineering' },
  { name: 'Marco Bianchi', team: 'engineering' },
  { name: 'Yuki Tanaka', team: 'engineering' },
  { name: 'Grace Mensah', team: 'finance' },
  { name: 'Oliver Grant', team: 'legal' },
  { name: 'Sofia Lindqvist', team: 'marketing' },
  { name: 'Daniel Costa', team: 'marketing' },
  { name: 'Hana Novak', team: 'operations' },
  { name: 'Samuel Reyes', team: 'people' },
  { name: 'Chloé Martin', team: 'product' },
  { name: 'Arjun Mehta', team: 'product' },
  { name: 'Ingrid Berg', team: 'research-and-development' },
  { name: 'Kwame Asante', team: 'sales' },
  { name: 'Elena Petrova', team: 'sales' },
  { name: 'Noah Williams', team: 'sales-operations' },
];

const teamLabels = new Map(teams.map((team) => [team.value, team.label]));

// Stands in for an API call: answers after a network-like delay. No teams
// means no filter.
function fetchPeople(
  teamValues: string[],
  signal: AbortSignal,
): Promise<Person[]> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve(
        teamValues.length === 0
          ? people
          : people.filter((person) => teamValues.includes(person.team)),
      );
    }, 400);
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

function Demo() {
  const [values, setValues] = useState<string[]>([]);

  const [requestCount, setRequestCount] = useState(0);

  const [results, setResults] = useState(people);

  const [isLoading, setIsLoading] = useState(false);

  const requestRef = useRef<AbortController | null>(null);

  const [isDisabled, setIsDisabled] = useState(false);

  // Portal host inside <main>, so the menu stays in the page landmark.
  const [menuHost, setMenuHost] = useState<HTMLDivElement | null>(null);

  const appliedLabels = teams
    .filter((team) => values.includes(team.value))
    .map((team) => team.label);

  // One request per applied change. A newer request cancels the older one,
  // so a slow response never overwrites a newer filter.
  function applyFilter(nextValues: string[]) {
    setValues(nextValues);
    setRequestCount((prev) => prev + 1);
    setIsLoading(true);

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    fetchPeople(nextValues, controller.signal).then(
      (nextResults) => {
        setResults(nextResults);
        setIsLoading(false);
      },
      () => {
        // Aborted: the newer request takes over, loading stays on.
      },
    );
  }

  return (
    <main className="demo">
      <header className="demo-header">
        <p className="demo-eyebrow">Component preview</p>
        <h1>React multiselect with tags</h1>
        <p>
          Tick several teams, then press OK: the list is fetched once, not on
          every tick. Close the menu without OK and the draft is discarded.
        </p>
        <p className="demo-links">
          <a
            className="demo-github"
            href="https://github.com/alessandvoken/react-multiselect-with-tags"
          >
            <GitHubIcon />
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
            <dt>Requests</dt>
            <dd>{requestCount}</dd>
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
          onChange={applyFilter}
        />
        <p id="teams-help" className="demo-help">
          Each call to onChange sends one mock request: on OK, Reset or tag
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
      <section
        className="demo-card"
        aria-labelledby="results-title"
        aria-busy={isLoading}
      >
        <div className="demo-results-header">
          <h2 id="results-title">People</h2>
          <output className="demo-results-status">
            {isLoading
              ? 'Loading…'
              : `${results.length} ${results.length === 1 ? 'person' : 'people'}`}
          </output>
        </div>
        <ul className="demo-results" data-loading={isLoading || undefined}>
          {results.map((person) => (
            <li key={person.name}>
              <span>{person.name}</span>
              <span className="demo-results-team">
                {teamLabels.get(person.team)}
              </span>
            </li>
          ))}
        </ul>
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
