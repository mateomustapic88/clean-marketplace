<template>
  <div class="base-tabs">
    <div
      ref="tabList"
      class="base-tabs__list"
      role="tablist"
      :aria-label="label"
      @keydown="handleKeydown"
    >
      <button
        v-for="tab in tabs"
        :id="`${tabsId}-${tab.id}`"
        :key="tab.id"
        class="base-tabs__tab"
        :class="{ 'base-tabs__tab--active': model === tab.id }"
        type="button"
        role="tab"
        :disabled="tab.disabled"
        :aria-selected="model === tab.id"
        :aria-controls="`${tabsId}-${tab.id}-panel`"
        :tabindex="model === tab.id ? 0 : -1"
        @click="model = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      :id="`${tabsId}-${model}-panel`"
      class="base-tabs__panel"
      role="tabpanel"
      :aria-labelledby="`${tabsId}-${model}`"
      tabindex="0"
    >
      <slot :active-tab="model" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TabItem } from '~/types/ui'

const props = defineProps<{
  tabs: TabItem[]
  label: string
}>()

const model = defineModel<string>({ required: true })
const tabsId = `tabs-${useId()}`
const tabList = useTemplateRef<HTMLElement>('tabList')

const handleKeydown = (event: KeyboardEvent) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    return
  }

  const enabledTabs = props.tabs.filter((tab) => !tab.disabled)
  const currentIndex = enabledTabs.findIndex((tab) => tab.id === model.value)
  let nextIndex = currentIndex

  if (event.key === 'Home') {
    nextIndex = 0
  }
  else if (event.key === 'End') {
    nextIndex = enabledTabs.length - 1
  }
  else if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % enabledTabs.length
  }
  else {
    nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length
  }

  const nextTab = enabledTabs[nextIndex]
  if (!nextTab) {
    return
  }

  event.preventDefault()
  model.value = nextTab.id
  nextTick(() => {
    tabList.value
      ?.querySelector<HTMLElement>(`#${CSS.escape(`${tabsId}-${nextTab.id}`)}`)
      ?.focus()
  })
}
</script>

<style scoped lang="scss">
.base-tabs {
  &__list {
    display: flex;
    gap: $space-2;
    overflow-x: auto;
    border-bottom: 1px solid $color-border;
  }

  &__tab {
    position: relative;
    min-height: 3rem;
    padding: $space-3 $space-4;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    color: $color-text-secondary;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 0;

    &::after {
      position: absolute;
      right: $space-3;
      bottom: -1px;
      left: $space-3;
      height: 2px;
      content: '';
      background: transparent;
    }

    &:hover:not(:disabled) {
      color: $color-primary;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.45;
    }

    &--active {
      color: $color-primary-dark;

      &::after {
        background: $color-primary;
      }
    }
  }

  &__panel {
    padding-top: $space-6;
  }
}
</style>
