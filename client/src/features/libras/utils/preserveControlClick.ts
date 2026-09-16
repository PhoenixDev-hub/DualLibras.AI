const CONTROL_SELECTOR =
  'button, a[href], input, select, textarea, label, [role="button"], [role="switch"], [role="tab"], [contenteditable="true"]'

export function preserveControlClick(event: Event) {
  const path = event.composedPath()
  if (
    path.some(
      (node) =>
        node instanceof Element && node.matches('[vw], #vlibras-app-root, #vlibras-access-wrapper'),
    )
  )
    return

  if (!path.some((node) => node instanceof Element && node.matches(CONTROL_SELECTOR))) return

  Object.defineProperty(event, '__vlibrasSyntheticClick', { value: true, configurable: true })
}
