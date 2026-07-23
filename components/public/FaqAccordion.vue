<template>
  <div class="faq-accordion">
    <details v-for="item in items" :key="item.question">
      <summary>
        {{ item.question }}
        <ChevronDown :size="20" aria-hidden="true" />
      </summary>
      <p>{{ item.answer }}</p>
    </details>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown } from '@lucide/vue'
defineProps<{ items: Array<{ question: string, answer: string }> }>()
</script>

<style scoped lang="scss">
.faq-accordion {
  display: grid;
  gap: $space-3;
  max-width: 50rem;
  margin-inline: auto;

  details {
    padding: $space-5;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-lg;
  }

  summary {
    display: flex;
    gap: $space-4;
    align-items: center;
    justify-content: space-between;
    font-weight: $font-weight-semibold;
    cursor: pointer;
  }

  p {
    padding-top: $space-4;
    color: $color-text-secondary;
  }
}
</style>
