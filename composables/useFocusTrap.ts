const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export const useFocusTrap = (
  container: Readonly<Ref<HTMLElement | null>>,
  active: Ref<boolean>,
) => {
  let previouslyFocused: HTMLElement | null = null

  const getFocusableElements = () => Array.from(
    container.value?.querySelectorAll<HTMLElement>(focusableSelector) ?? [],
  ).filter((element) => !element.hasAttribute('hidden'))

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !active.value) {
      return
    }

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements.at(0)
    const lastElement = focusableElements.at(-1)

    if (!firstElement || !lastElement) {
      event.preventDefault()
      container.value?.focus()
      return
    }

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    }
    else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  watch(active, async (isActive) => {
    if (!import.meta.client) {
      return
    }

    if (isActive) {
      previouslyFocused = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      document.addEventListener('keydown', handleKeydown)
      await nextTick()
      const firstElement = getFocusableElements().at(0)
      if (firstElement) {
        firstElement.focus()
      }
      else {
        container.value?.focus()
      }
    }
    else {
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus()
      previouslyFocused = null
    }
  })

  onBeforeUnmount(() => {
    if (import.meta.client) {
      document.removeEventListener('keydown', handleKeydown)
      previouslyFocused?.focus()
    }
  })
}
