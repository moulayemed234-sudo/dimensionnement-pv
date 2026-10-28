import { useLayoutEffect, useRef } from 'react';
import { softSwap } from '../ui/softSwap';

/**
 * Text that cross-blurs to its new value when it changes, e.g. a result that
 * updates while the engineer types. The DOM is managed by softSwap, not React.
 */
export function SoftText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.dataset.text === undefined) {
      el.dataset.text = text;
      el.textContent = text;
      return;
    }
    softSwap(el, text);
  }, [text]);

  return <span ref={ref} className="t-text-soft" />;
}
