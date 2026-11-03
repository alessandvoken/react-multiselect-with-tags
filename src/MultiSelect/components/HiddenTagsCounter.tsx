import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';

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
export function HiddenTagsCounter({ labels }: { labels: string[] }) {
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
