<template>
  <div class="photo-uploader">
    <label :for="id">{{ t('owner.job.fields.photos') }}</label>
    <input :id="id" type="file" accept=".jpg,.jpeg,.png,.webp" multiple @change="selectFiles">
    <p>{{ t('owner.job.fields.photoHint') }}</p>
    <div class="photo-uploader__previews"><img v-for="photo in previews" :key="photo.id" :src="photo.previewUrl" :alt="photo.name"></div>
    <BaseAlert v-if="error" variant="error">{{ error }}</BaseAlert>
  </div>
</template>

<script setup lang="ts">
import { mockUploadService, type MockUpload } from '~/services/uploads/mockUploadService'

const emit = defineEmits<{ update: [urls: string[]] }>()
const { t } = useI18n()
const id = `photos-${useId()}`
const previews = ref<MockUpload[]>([])
const error = ref('')
const selectFiles = async (event: Event) => {
  const files = [...((event.target as HTMLInputElement).files ?? [])]
  try {
    previews.value = await Promise.all(files.map((file) => mockUploadService.createPreview(file)))
    emit('update', previews.value.map((item) => item.previewUrl))
    error.value = ''
  }
  catch { error.value = t('owner.job.fields.photoError') }
}
</script>

<style scoped lang="scss">
.photo-uploader { display: grid; gap: $space-3; padding: $space-4; border: 1px dashed $color-border-strong; border-radius: $radius-lg;
  label { font-weight: $font-weight-semibold; } p { color: $color-text-secondary; }
  &__previews { display: flex; gap: $space-3; flex-wrap: wrap; img { width: 6rem; height: 6rem; object-fit: cover; border-radius: $radius-md; } }
}
</style>
