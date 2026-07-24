export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('page:finish', () => {
    const main = document.querySelector<HTMLElement>('#main-content')
    if (!main) return

    main.setAttribute('tabindex', '-1')
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      main.scrollIntoView({ block: 'start' })
    }
    main.focus({ preventScroll: true })
  })
})
