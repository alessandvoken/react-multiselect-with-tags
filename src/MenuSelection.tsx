import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  components,
  type InputProps,
  type MenuProps,
  type OptionProps,
  type ValueContainerProps,
} from 'react-select';

import type { MultiSelectOption } from './MultiSelect';

// Space always kept free for the search input next to the tags, in px.
export const INPUT_MIN_WIDTH = 40;

export type MultiSelectContextValue = {
  resetLabel: string;
  confirmLabel: string;
  isFooterDisabled: boolean;
  onReset: () => void;
  onConfirm: () => void;
  maxVisibleTags?: number;
  ariaDescribedBy?: string;
  footerRef: RefObject<HTMLFieldSetElement | null>;
  inputRef: () => HTMLInputElement | null;
  onFocusInput: () => void;
  onDismiss: () => void;
  onCloseMenu: () => void;
  onTabOut: () => boolean;
};

// react-select does not forward extra props to custom components, so they read
// draft-related state and handlers from MultiSelect via context.
const MultiSelectContext = createContext<MultiSelectContextValue | null>(null);

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

function useMultiSelectContext() {
  const value = useContext(MultiSelectContext);
  if (!value) {
    throw new Error('MultiSelect parts must be rendered inside MultiSelect');
  }
  return value;
}

function selectedValuesId(inputId: string | undefined) {
  return `${inputId}-selected-values`;
}

function outerWidth(element: Element) {
  const style = getComputedStyle(element);
  return (
    element.getBoundingClientRect().width +
    parseFloat(style.marginLeft) +
    parseFloat(style.marginRight)
  );
}

export function MenuSelect({
  children,
  ...rest
}: MenuProps<MultiSelectOption, true>) {
  const {
    resetLabel,
    confirmLabel,
    isFooterDisabled,
    onReset,
    onConfirm,
    footerRef,
    inputRef,
    onFocusInput,
    onDismiss,
    onCloseMenu,
    onTabOut,
  } = useMultiSelectContext();

  function handleKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    // react-select listens for keys on its container: without this, Enter or
    // Space on a button would also toggle the focused option.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== 'Tab') return;
    // Explicit, so it also works when the menu is portalled elsewhere in the
    // DOM: Shift+Tab from the first button returns to the input, Tab from the
    // last one continues after the component.
    const buttons = [
      ...(footerRef.current?.querySelectorAll('button:enabled') ?? []),
    ];
    if (event.shiftKey && event.currentTarget === buttons[0]) {
      event.preventDefault();
      onFocusInput();
    } else if (!event.shiftKey && event.currentTarget === buttons.at(-1)) {
      if (onTabOut()) event.preventDefault();
    }
  }

  function handleBlur(event: FocusEvent<HTMLButtonElement>) {
    const next = event.relatedTarget;
    if (next instanceof Node && footerRef.current?.contains(next)) return;
    if (next === inputRef()) return;
    // Focus left the component from the footer: close and discard the draft.
    onCloseMenu();
  }

  return (
    <components.Menu {...rest}>
      {children}
      <fieldset
        ref={footerRef}
        className="multiselect-footer"
        aria-label="Selection actions"
      >
        <button
          type="button"
          disabled={isFooterDisabled}
          onClick={onReset}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        >
          {resetLabel}
        </button>
        <button
          type="button"
          className="multiselect-confirm"
          disabled={isFooterDisabled}
          onClick={onConfirm}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        >
          {confirmLabel}
        </button>
      </fieldset>
    </components.Menu>
  );
}

// Visual-only checkbox: a real <input> inside role="option" would be a nested
// interactive control. Selection is exposed by the option itself.
export function OptionWithCheckbox({
  children,
  ...rest
}: OptionProps<MultiSelectOption, true>) {
  const checkboxClassName = [
    'multiselect-checkbox',
    rest.isSelected && 'multiselect-checkbox--checked',
    rest.isDisabled && 'multiselect-checkbox--disabled',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <components.Option {...rest}>
      <span className={checkboxClassName} aria-hidden="true" />
      {children}
    </components.Option>
  );
}

// Shows the confirmed tags that fit in one row, then a +N counter for the rest.
// A hidden measuring layer renders every tag, so the fit follows container
// width, zoom and font; ResizeObserver re-measures when any of them change.
export function TagsValueContainer({
  children,
  ...rest
}: ValueContainerProps<MultiSelectOption, true>) {
  const { maxVisibleTags } = useMultiSelectContext();
  const measureRef = useRef<HTMLDivElement>(null);
  const [fitCount, setFitCount] = useState(Number.POSITIVE_INFINITY);

  // react-select passes [tags or placeholder, input].
  const [valueNodes, input]: ReactNode[] = Array.isArray(children)
    ? children
    : [children, null];
  const tags: ReactNode[] =
    rest.hasValue && Array.isArray(valueNodes) ? valueNodes : [];
  const selected = rest.getValue();
  const valuesKey = selected.map((option) => option.value).join('\n');

  useLayoutEffect(() => {
    const layer = measureRef.current;
    if (!layer || valuesKey === '') return undefined;

    function measure(element: HTMLDivElement) {
      const style = getComputedStyle(element);
      const available =
        element.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight) -
        INPUT_MIN_WIDTH;
      const items = [...element.children];
      const counter = items.pop();
      const counterWidth = counter ? outerWidth(counter) : 0;
      const widths = items.map(outerWidth);

      // Drop tags from the end until the rest, plus +N if any are hidden, fit.
      let count = widths.length;
      let used = widths.reduce((sum, width) => sum + width, 0);
      while (
        count > 1 &&
        used + (count < widths.length ? counterWidth : 0) > available
      ) {
        count -= 1;
        used -= widths[count];
      }
      setFitCount(count);
    }

    measure(layer);
    // Observing the tags too catches width changes from late-loading fonts.
    const observer = new ResizeObserver(() => measure(layer));
    observer.observe(layer);
    for (const tag of layer.children) observer.observe(tag);
    return () => observer.disconnect();
  }, [valuesKey]);

  const hasTags = tags.length > 0;
  const visibleCount = Math.max(
    1,
    Math.min(fitCount, maxVisibleTags ?? Number.POSITIVE_INFINITY),
  );
  const hiddenLabels = selected
    .slice(visibleCount)
    .map((option) => option.label);
  const hiddenCount = hiddenLabels.length;

  // Same child positions with and without tags, so the input keeps its DOM
  // node (and focus) when the last tag is removed or the first one added.
  return (
    <components.ValueContainer {...rest}>
      {hasTags ? tags.slice(0, visibleCount) : valueNodes}
      {hiddenCount > 0 && <HiddenTagsCounter labels={hiddenLabels} />}
      {input}
      {hasTags && (
        <span id={selectedValuesId(rest.selectProps.inputId)} hidden>
          Selected: {selected.map((option) => option.label).join(', ')}.
        </span>
      )}
      {hasTags && (
        <div
          ref={measureRef}
          className="multiselect-measure"
          aria-hidden="true"
        >
          {tags}
          <span className="multiselect-more">+{tags.length}</span>
        </div>
      )}
    </components.ValueContainer>
  );
}

const TOOLTIP_OPEN_DELAY = 100;
const TOOLTIP_CLOSE_DELAY = 150;
const TOOLTIP_GAP = 6;
const VIEWPORT_MARGIN = 8;

// +N counter with a hover list of the hidden labels, one per line. The list is
// a mouse aid only (aria-hidden): assistive tech gets every confirmed value
// through aria-describedby, keyboard users see them checked in the menu.
// Follows WCAG 1.4.13: the list can be hovered, stays until the pointer
// leaves, and Escape dismisses it. It renders in the top layer (Popover API)
// so the control's overflow cannot clip it; without Popover support it falls
// back to position: fixed.
function HiddenTagsCounter({ labels }: { labels: string[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const counterRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);

  function schedule(nextIsOpen: boolean, delay: number) {
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setIsOpen(nextIsOpen), delay);
  }

  function handlePointerEnter(event: PointerEvent) {
    // On touch a tap opens the menu instead, which lists every value.
    if (event.pointerType === 'touch') return;
    schedule(true, isOpen ? 0 : TOOLTIP_OPEN_DELAY);
  }

  function handlePointerLeave() {
    schedule(false, TOOLTIP_CLOSE_DELAY);
  }

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  useLayoutEffect(() => {
    const counter = counterRef.current;
    const tooltip = tooltipRef.current;
    if (!isOpen || !counter || !tooltip) return undefined;

    if (typeof tooltip.showPopover === 'function') {
      tooltip.setAttribute('popover', 'manual');
      tooltip.showPopover();
    }

    const anchor = counter.getBoundingClientRect();
    const { width, height } = tooltip.getBoundingClientRect();
    const fitsBelow =
      anchor.bottom + TOOLTIP_GAP + height <=
      window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow
      ? anchor.bottom + TOOLTIP_GAP
      : anchor.top - TOOLTIP_GAP - height;
    const left = Math.max(
      VIEWPORT_MARGIN,
      Math.min(anchor.left, window.innerWidth - VIEWPORT_MARGIN - width),
    );
    tooltip.style.top = `${Math.max(VIEWPORT_MARGIN, top)}px`;
    tooltip.style.left = `${left}px`;

    function close() {
      window.clearTimeout(timerRef.current);
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    // The position is computed once, so moving the page closes the list.
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [isOpen]);

  const count = labels.length;

  return (
    <span
      ref={counterRef}
      className="multiselect-more"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      <span aria-hidden="true">+{count}</span>
      <span className="multiselect-visually-hidden">
        {count} more selected {count === 1 ? 'option' : 'options'}
      </span>
      {isOpen && (
        <div
          ref={tooltipRef}
          className="multiselect-tooltip"
          aria-hidden="true"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          <ul>
            {labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}
    </span>
  );
}

// Adds the full list of confirmed values to the input's accessible
// description, so values hidden behind +N are not reachable only by hover.
export function InputWithSelectedValues(
  props: InputProps<MultiSelectOption, true>,
) {
  const { ariaDescribedBy } = useMultiSelectContext();
  // Consumer help or error text first, then react-select's own description,
  // then the list of confirmed values.
  const describedBy = [
    ariaDescribedBy,
    props['aria-describedby'],
    props.hasValue && selectedValuesId(props.selectProps.inputId),
  ]
    .filter(Boolean)
    .join(' ');

  // react-select sets aria-haspopup="true", which means a menu; the popup here
  // is a listbox.
  return (
    <components.Input
      {...props}
      aria-haspopup="listbox"
      aria-describedby={describedBy || undefined}
    />
  );
}
