import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { components, type ValueContainerProps } from 'react-select';

import { useMultiSelectContext } from '../context';
import { INPUT_MIN_WIDTH, outerWidth, selectedValuesId } from '../dom';
import type { MultiSelectOption } from '../types';
import { HiddenTagsCounter } from './HiddenTagsCounter';

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
