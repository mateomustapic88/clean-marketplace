<template>
  <BaseBadge variant="warning">
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
