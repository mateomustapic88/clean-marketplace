<template>
  <BaseBadge class="demo-badge" variant="neutral">
    {{ t(labelKey) }}
  </BaseBadge>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'profile' | 'listing' | 'rating'
}>(), {
  type: 'listing',
})
const { t } = useI18n()
const labelKey = computed(() => ({
  profile: 'demo.profileBadge',
  listing: 'demo.listingBadge',
  rating: 'demo.ratingBadge',
})[props.type])
</script>

<style scoped lang="scss">
.demo-badge {
  color: $color-primary-dark;
  background: rgba($color-primary, 0.09);
  border: 1px solid rgba($color-primary, 0.14);
}
</style>
