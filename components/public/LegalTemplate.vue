<template>
  <div class="legal-template">
    <PageHero :eyebrow="eyebrow" :title="title" :description="description" />
    <div class="legal-template__layout container">
      <aside>
        <h2>{{ contentsLabel }}</h2>
        <nav :aria-label="contentsLabel">
          <a v-for="section in sections" :key="section.id" :href="`#${section.id}`">
            {{ section.title }}
          </a>
        </nav>
      </aside>
      <main>
        <BaseAlert variant="warning" :title="reviewTitle">{{ reviewDescription }}</BaseAlert>
        <section v-for="section in sections" :id="section.id" :key="section.id">
          <h2>{{ section.title }}</h2>
          <p v-for="paragraph in section.paragraphs" :key="paragraph">{{ paragraph }}</p>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
  contentsLabel: string
  reviewTitle: string
  reviewDescription: string
  sections: Array<{ id: string, title: string, paragraphs: string[] }>
}>()
</script>

<style scoped lang="scss">
.legal-template {
  &__layout {
    display: grid;
    gap: $space-10;
    padding-block: $space-12 $space-20;
  }

  aside {
    align-self: start;
    padding: $space-5;
    background: $color-surface;
    border: 1px solid $color-border;
    border-radius: $radius-lg;

    h2 {
      margin-bottom: $space-4;
      font-size: $font-size-sm;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    nav {
      display: grid;
      gap: $space-3;
    }

    a {
      font-size: $font-size-sm;
      color: $color-primary;
    }
  }

  main {
    min-width: 0;

    section {
      padding-block: $space-8;
      border-bottom: 1px solid $color-border;
      scroll-margin-top: calc($header-height + $space-5);
    }

    h2 {
      margin-bottom: $space-4;
      font-size: $font-size-xl;
    }

    p {
      margin-bottom: $space-4;
      color: $color-text-secondary;
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__layout {
      grid-template-columns: 17rem minmax(0, 1fr);
    }

    aside {
      position: sticky;
      top: calc($header-height + $space-5);
    }
  }
}
</style>
