<template>
  <div ref="root" class="base-dropdown">
    <button
      ref="trigger"
      class="base-dropdown__trigger"
      type="button"
      :aria-expanded="open"
      :aria-controls="menuId"
      aria-haspopup="menu"
      @click="open = !open"
      @keydown.esc="close(true)"
      @keydown.down.prevent="openMenu"
    >
      <slot name="trigger" :open="open" />
      <ChevronDown
        class="base-dropdown__chevron"
        :class="{ 'base-dropdown__chevron--open': open }"
        :size="16"
        aria-hidden="true"
      />
    </button>
    <Transition name="base-dropdown-transition">
      <div
        v-if="open"
        :id="menuId"
        ref="menu"
        class="base-dropdown__menu"
        role="menu"
        tabindex="-1"
        @click="open = false"
        @keydown.esc="close(true)"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'

const open = ref(false)
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const menu = useTemplateRef<HTMLElement>('menu')
const menuId = `dropdown-${useId()}-menu`

const onPointerDown = (event: PointerEvent) => {
  if (!root.value?.contains(event.target as Node)) {
    close()
  }
}

const close = (restoreFocus = false) => {
  open.value = false
  if (restoreFocus) {
    nextTick(() => trigger.value?.focus())
  }
}

const openMenu = async () => {
  open.value = true
  await nextTick()
  const firstMenuItem = menu.value?.querySelector<HTMLElement>(
    '[role="menuitem"], a[href], button:not([disabled])',
  )
  if (firstMenuItem) {
    firstMenuItem.focus()
  }
  else {
    menu.value?.focus()
  }
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<style scoped lang="scss">
.base-dropdown {
  position: relative;
  display: inline-block;

  &__trigger {
    display: inline-flex;
    gap: $space-2;
    align-items: center;
    min-height: 2.75rem;
    padding: $space-2 $space-3;
    font-size: $font-size-sm;
    font-weight: $font-weight-semibold;
    cursor: pointer;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-md;
  }

  &__chevron {
    transition: transform $transition-fast;

    &--open {
      transform: rotate(180deg);
    }
  }

  &__menu {
    position: absolute;
    top: calc(100% + $space-2);
    right: 0;
    z-index: $z-dropdown;
    min-width: 12rem;
    padding: $space-2;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-md;
    box-shadow: $shadow-md;
  }
}

.base-dropdown-transition-enter-active,
.base-dropdown-transition-leave-active {
  transition:
    opacity $transition-fast,
    transform $transition-fast;
}

.base-dropdown-transition-enter-from,
.base-dropdown-transition-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
