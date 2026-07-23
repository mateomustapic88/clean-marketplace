import { defineStore } from 'pinia'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface UiToast {
  id: string
  messageKey: string
  variant: ToastVariant
}

export const useUiStore = defineStore('ui', () => {
  const globalLoading = ref(false)
  const mobileNavigationOpen = ref(false)
  const toasts = ref<UiToast[]>([])

  const setGlobalLoading = (loading: boolean) => {
    globalLoading.value = loading
  }

  const setMobileNavigationOpen = (open: boolean) => {
    mobileNavigationOpen.value = open
  }

  const addToast = (messageKey: string, variant: ToastVariant = 'info') => {
    const toast: UiToast = {
      id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`,
      messageKey,
      variant,
    }
    toasts.value.push(toast)
    return toast.id
  }

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  return {
    globalLoading,
    mobileNavigationOpen,
    toasts,
    setGlobalLoading,
    setMobileNavigationOpen,
    addToast,
    removeToast,
  }
})
