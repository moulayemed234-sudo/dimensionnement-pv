// Soft swap (transitions.dev "text swap soft"): the old text blurs out while the
// new text blurs in, at the same time and in the same spot, and the width eases
// so the elements beside it glide to their new place.
const ms = (name: string) =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name)) || 0;

const timers = new WeakMap<HTMLElement, number>();

export function softSwap(el: HTMLElement, next: string): void {
  const prev = el.dataset.text ?? el.textContent ?? '';
  if (prev === next) return;
  el.dataset.text = next;
  clearTimeout(timers.get(el));

  const out = document.createElement('span');
  out.className = 't-text-soft-old';
  out.setAttribute('aria-hidden', 'true');
  out.textContent = prev;
  const inn = document.createElement('span');
  inn.className = 't-text-soft-new';
  inn.textContent = next;

  const w0 = el.getBoundingClientRect().width;
  el.classList.remove('is-swapping');
  el.replaceChildren(out, inn);
  const w1 = inn.getBoundingClientRect().width;
  el.style.width = w0 + 'px';
  void el.offsetWidth; // force reflow so every transition runs
  el.classList.add('is-swapping');
  el.style.width = w1 + 'px';

  timers.set(
    el,
    window.setTimeout(
      () => {
        el.classList.remove('is-swapping');
        el.style.removeProperty('width');
        el.textContent = next;
      },
      Math.max(ms('--text-soft-dur'), ms('--text-soft-resize-dur')) + 40,
    ),
  );
}
