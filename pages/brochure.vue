<template>
  <div class="brochure-page">
    <div class="brochure-page__toolbar">
      <div>
        <strong>Clean Marketplace brošura</strong>
        <span>A4 · portret · spremno za ispis</span>
      </div>
      <div class="brochure-page__actions">
        <a
          href="/downloads/clean-marketplace-brosura-iznajmljivaci.pdf"
          download
        >
          <Download :size="18" aria-hidden="true" />
          Preuzmi PDF
        </a>
        <button type="button" @click="printBrochure">
          <Printer :size="18" aria-hidden="true" />
          Ispiši
        </button>
      </div>
    </div>
    <OwnerBrochure />
  </div>
</template>

<script setup lang="ts">
import { Download, Printer } from '@lucide/vue'
import OwnerBrochure from '~/components/marketing/OwnerBrochure.vue'

definePageMeta({ layout: false })
defineI18nRoute({
  paths: {
    hr: '/brochure',
    en: '/brochure',
    sl: '/brochure',
  },
})

useHead({
  htmlAttrs: { lang: 'hr' },
  title: 'Brošura za iznajmljivače | Clean Marketplace',
  meta: [
    {
      name: 'description',
      content: 'Informativna brošura platforme Clean Marketplace za hrvatske iznajmljivače apartmana.',
    },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})

const printBrochure = () => window.print()
</script>

<style lang="scss">
@page {
  size: A4 portrait;
  margin: 0;
}

.brochure-page {
  min-height: 100vh;
  padding: $space-8;
  overflow-x: auto;
  background: #edf1ef;

  &__toolbar {
    display: flex;
    width: min(100%, 210mm);
    margin: 0 auto $space-5;
    align-items: center;
    justify-content: space-between;
    gap: $space-4;

    div {
      display: grid;
      gap: $space-1;
    }

    strong {
      color: $color-primary-dark;
    }

    span {
      font-size: $font-size-sm;
      color: $color-text-secondary;
    }

    button,
    a {
      display: inline-flex;
      padding: $space-3 $space-5;
      align-items: center;
      gap: $space-2;
      font-weight: $font-weight-bold;
      color: $color-surface;
      cursor: pointer;
      background: $color-primary-dark;
      border: 0;
      border-radius: $radius-full;
      box-shadow: $shadow-sm;
    }

    a {
      color: $color-primary-dark;
      text-decoration: none;
      background: $color-surface;
      border: 1px solid $color-border-strong;
    }
  }

  &__actions {
    display: flex !important;
    gap: $space-2 !important;
  }

  > .owner-brochure {
    margin-inline: auto;
  }
}

@media print {
  html,
  body,
  #__nuxt {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    margin: 0;
    background: #fff;
  }

  .brochure-page {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    padding: 0;
    overflow: hidden;
    background: #fff;

    &__toolbar {
      display: none;
    }
  }
}
</style>
