<template>
  <section class="page-error-state" role="alert">
    <BaseCard>
      <AlertTriangle :size="36" aria-hidden="true" />
      <h1>{{ t('errorPage.runtimeTitle') }}</h1>
      <p>{{ t('errorPage.runtimeDescription') }}</p>
      <div class="page-error-state__actions">
        <BaseButton @click="emit('retry')">{{ t('errorPage.retry') }}</BaseButton>
        <BaseButton variant="secondary" :to="getAppRoute('home', locale)">
          {{ t('errorPage.action') }}
        </BaseButton>
      </div>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import { AlertTriangle } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'

const emit = defineEmits<{ retry: [] }>()
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.page-error-state {
  display: grid;
  min-height: 55vh;
  padding: $space-8;
  place-items: center;

  :deep(.base-card) {
    display: grid;
    justify-items: center;
    max-width: 36rem;
    text-align: center;
  }

  svg {
    color: $color-error;
  }

  h1 {
    margin-top: $space-4;
    font-size: $font-size-2xl;
  }

  p {
    margin-top: $space-2;
    color: $color-text-secondary;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    justify-content: center;
    margin-top: $space-6;
  }
}
</style>
