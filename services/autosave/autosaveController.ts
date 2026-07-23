export type AutosaveStatus = 'saved' | 'saving' | 'unsaved'

export interface AutosaveController {
  markDirty(): void
  saveNow(): Promise<void>
  start(): void
  stop(): void
  status(): AutosaveStatus
}

export const createAutosaveController = (
  save: () => Promise<void>,
  onStatus: (status: AutosaveStatus) => void,
  intervalMs = 3000,
): AutosaveController => {
  let currentStatus: AutosaveStatus = 'saved'
  let timer: ReturnType<typeof setInterval> | undefined
  let pendingSave: Promise<void> | null = null
  const update = (status: AutosaveStatus) => {
    currentStatus = status
    onStatus(status)
  }
  const saveNow = async () => {
    if (pendingSave) {
      await pendingSave
      return
    }
    update('saving')
    pendingSave = save()
      .then(() => update('saved'))
      .finally(() => {
        pendingSave = null
      })
    await pendingSave
  }
  return {
    markDirty: () => update('unsaved'),
    saveNow,
    start: () => {
      timer ??= setInterval(() => {
        if (currentStatus === 'unsaved') void saveNow()
      }, intervalMs)
    },
    stop: () => {
      clearInterval(timer)
      timer = undefined
    },
    status: () => currentStatus,
  }
}
