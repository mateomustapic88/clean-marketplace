<template>
  <Teleport to="body">
    <Transition name="base-modal-transition">
      <div
        v-if="model"
        class="base-modal"
        role="presentation"
        @mousedown.self="closeOnBackdrop && close()"
      >
        <section
          ref="dialog"
          class="base-modal__dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="description ? descriptionId : undefined"
          tabindex="-1"
          @keydown.esc="close"
        >
          <header class="base-modal__header">
            <div>
              <h2 :id="titleId" class="base-modal__title">{{ title }}</h2>
              <p v-if="description" :id="descriptionId" class="base-modal__description">
                {{ description }}
              </p>
            </div>
            <button
              class="base-modal__close"
              type="button"
              :aria-label="t('common.close')"
              @click="close"
            >
              <X :size="22" aria-hidden="true" />
            </button>
          </header>
          <div class="base-modal__content">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { X } from '@lucide/vue'

withDefaults(defineProps<{
  title: string
  description?: string
  closeOnBackdrop?: boolean
}>(), {
  closeOnBackdrop: true,
})

const model = defineModel<boolean>({ default: false })
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
const generatedId = useId()
const titleId = `modal-${generatedId}-title`
const descriptionId = `modal-${generatedId}-description`
const dialog = useTemplateRef<HTMLElement>('dialog')

useBodyScrollLock(model)
useFocusTrap(dialog, model)

const close = () => {
  model.value = false
  emit('close')
}
</script>

<style scoped lang="scss">
.base-modal {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  display: grid;
  padding: $space-4;
  overflow-y: auto;
  place-items: center;
  background: $color-overlay;
  backdrop-filter: blur(4px);

  &__dialog {
    width: min(100%, 36rem);
    max-height: calc(100vh - 2rem);
    overflow-y: auto;
    background: $color-surface;
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;
    outline: none;
  }

  &__header {
    display: flex;
    gap: $space-4;
    align-items: flex-start;
    justify-content: space-between;
    padding: $space-6;
    border-bottom: 1px solid $color-border;
  }

  &__title {
    font-size: $font-size-xl;
    line-height: $line-height-tight;
  }

  &__description {
    margin-top: $space-2;
    font-size: $font-size-sm;
    color: $color-text-secondary;
  }

  &__close {
    display: grid;
    flex: 0 0 2.75rem;
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
    padding: $space-6;
  }

  &__footer {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    justify-content: flex-end;
    padding: $space-5 $space-6;
    background: $color-background;
    border-top: 1px solid $color-border;
  }
}

.base-modal-transition-enter-active,
.base-modal-transition-leave-active {
  transition: opacity $transition-base;
}

.base-modal-transition-enter-from,
.base-modal-transition-leave-to {
  opacity: 0;
}
</style>
