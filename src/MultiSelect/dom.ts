// Space always kept free for the search input next to the tags, in px.
export const INPUT_MIN_WIDTH = 40;

export function selectedValuesId(inputId: string | undefined) {
  return `${inputId}-selected-values`;
}

export function outerWidth(element: Element) {
  const style = getComputedStyle(element);
  return (
    element.getBoundingClientRect().width +
    parseFloat(style.marginLeft) +
    parseFloat(style.marginRight)
  );
}

const TABBABLE = [
  'a[href]',
  'button:enabled',
  'input:enabled:not([type="hidden"])',
  'select:enabled',
  'textarea:enabled',
  '[tabindex]',
].join(',');

// First element in tab order after `container`, skipping anything inside it.
export function nextTabbableAfter(container: Element) {
  return [...document.querySelectorAll<HTMLElement>(TABBABLE)].find(
    (element) =>
      element.tabIndex >= 0 &&
      element.getClientRects().length > 0 &&
      !container.contains(element) &&
      (container.compareDocumentPosition(element) &
        Node.DOCUMENT_POSITION_FOLLOWING) !==
        0,
  );
}
