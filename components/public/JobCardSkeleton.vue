<template>
  <div class="catalog-skeleton" aria-hidden="true">
    <BaseSkeleton width="7rem" height="1.5rem" />
    <BaseSkeleton width="85%" height="1.75rem" />
    <BaseSkeleton v-for="item in 3" :key="item" width="70%" height="1rem" />
    <BaseSkeleton width="100%" height="3rem" />
  </div>
</template>

<style scoped lang="scss">
.catalog-skeleton {
  display: grid;
  gap: $space-4;
  min-height: 22rem;
  padding: $space-6;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
}
</style>
