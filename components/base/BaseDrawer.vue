<template>
  <Teleport to="body">
    <Transition name="base-drawer-transition">
      <div
        v-if="model"
        class="base-drawer"
        role="presentation"
        @mousedown.self="close"
      >
        <aside
          ref="drawer"
          class="base-drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          tabindex="-1"
          @keydown.esc="close"
        >
          <header class="base-drawer__header">
            <h2 :id="titleId" class="base-drawer__title">{{ title }}</h2>
            <button
              class="base-drawer__close"
              type="button"
              :aria-label="t('common.close')"
              @click="close"
            >
              <X :size="22" aria-hidden="true" />
            </button>
          </header>
          <div class="base-drawer__content">
            <slot />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

defineProps<{ title: string }>()

const model = defineModel<boolean>({ default: false })
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const titleId = `drawer-${useId()}-title`
const drawer = useTemplateRef<HTMLElement>('drawer')

useBodyScrollLock(model)
useFocusTrap(drawer, model)

const close = () => {
  model.value = false
  emit('close')
}
</script>

<style scoped lang="scss">
.base-drawer {
  position: fixed;
  inset: 0;
  z-index: $z-drawer;
  background: $color-overlay;

  &__panel {
    width: min(90vw, 24rem);
    height: 100%;
    margin-left: auto;
    overflow-y: auto;
    background: $color-surface;
    box-shadow: $shadow-lg;
    outline: none;
  }

  &__header {
    display: flex;
    gap: $space-4;
    align-items: center;
    justify-content: space-between;
    min-height: $header-height;
    padding: $space-4 $space-5;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    font-size: $font-size-lg;
  }

  &__close {
    display: grid;
    width: 2.75rem;
    height: 2.75rem;
    padding: 0;
    cursor: pointer;
    place-items: center;
    background: transparent;
    border: 0;
    border-radius: $radius-md;

    &:hover {
      background: $color-primary-light;
    }
  }

  &__content {
    padding: $space-5;
  }
}

.base-drawer-transition-enter-active,
.base-drawer-transition-leave-active {
  transition: opacity $transition-base;

  .base-drawer__panel {
    transition: transform $transition-base;
  }
}

.base-drawer-transition-enter-from,
.base-drawer-transition-leave-to {
  opacity: 0;

  .base-drawer__panel {
    transform: translateX(100%);
  }
}
</style>
