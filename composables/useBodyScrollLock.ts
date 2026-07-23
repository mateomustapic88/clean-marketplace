export const useBodyScrollLock = (locked: Ref<boolean>) => {
  if (import.meta.client) {
    watch(locked, (isLocked) => {
      document.body.classList.toggle('is-scroll-locked', isLocked)
    }, { immediate: true })

    onBeforeUnmount(() => {
      document.body.classList.remove('is-scroll-locked')
    })
  }
}
