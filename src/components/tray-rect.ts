/** The tray's box in map coordinates (both sit in the same container), ignoring its slide-in transform. */
export function coveredRectOf(el: HTMLElement | null) {
  if (!el) return null;
  return { left: el.offsetLeft, top: el.offsetTop, right: el.offsetLeft + el.offsetWidth, bottom: el.offsetTop + el.offsetHeight };
}
