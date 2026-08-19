<template>
  <section class="hero-section">
    <div class="hero-section__inner container">
      <div class="hero-section__content">
        <p class="hero-section__eyebrow">{{ t('publicHome.hero.eyebrow') }}</p>
        <h1>{{ t('publicHome.hero.title') }}</h1>
        <p class="hero-section__description">{{ t('publicHome.hero.description') }}</p>
        <div class="hero-section__actions">
          <BaseButton size="lg" :to="getAppRoute('register', locale)">{{ t('publicHome.hero.ownerAction') }}</BaseButton>
          <BaseButton size="lg" variant="secondary" :to="getAppRoute('jobs', locale)">{{ t('publicHome.hero.cleanerAction') }}</BaseButton>
        </div>
      </div>
      <div class="hero-section__visual" role="img" :aria-label="t('publicHome.hero.visualLabel')">
        <div class="hero-section__job">
          <span>{{ t('publicHome.hero.cardLabel') }}</span>
          <strong>{{ t('publicHome.hero.cardTitle') }}</strong>
          <p><MapPin :size="15" />{{ t('publicHome.hero.cardCity') }}</p>
          <PriceDisplay :value="85" :suffix="t('jobs.budgetType.fixed')" />
        </div>
        <div class="hero-section__profile">
          <BaseAvatar :name="t('publicHome.hero.profileName')" size="md" />
          <div class="hero-section__profile-details">
            <div class="hero-section__profile-identity">
              <strong>{{ t('publicHome.hero.profileShortName') }}</strong>
              <DemoBadge type="profile" />
            </div>
            <RatingSummary :value="4.9" :count="12" />
          </div>
        </div>
        <svg viewBox="0 0 480 360" aria-hidden="true">
          <path d="M52 280C90 191 132 121 230 92c106-31 172 32 198 117 25 83-36 114-118 117-103 4-296 35-258-46Z" fill="#e7f3f2" />
          <path d="M103 213 239 105l137 108v93H103v-93Z" fill="#fff" stroke="#236a70" stroke-width="8" />
          <path d="M199 306v-78h78v78M146 214h45v42h-45zM291 214h45v42h-45z" fill="#fbf3df" stroke="#236a70" stroke-width="7" />
          <path d="m365 93 8 22 22 8-22 8-8 22-8-22-22-8 22-8 8-22Z" fill="#d9a441" />
        </svg>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MapPin } from '@lucide/vue'
import { getAppRoute } from '~/utils/routes'
const { t, locale } = useI18n()
</script>

<style scoped lang="scss">
.hero-section {
  overflow: hidden;
  background: linear-gradient(145deg, $color-background, $color-primary-light);

  &__inner {
    display: grid;
    gap: $space-12;
    align-items: center;
    min-height: 42rem;
    padding-block: $space-16;
  }

  &__content {
    max-width: 42rem;

    h1 {
      font-size: clamp(2.25rem, 6vw, 4.25rem);
      line-height: 1.05;
      letter-spacing: -0.035em;
    }
  }

  &__eyebrow {
    margin-bottom: $space-4;
    font-size: $font-size-xs;
    font-weight: $font-weight-bold;
    color: $color-primary;
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  &__description {
    margin-top: $space-6;
    font-size: $font-size-lg;
    color: $color-text-secondary;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: $space-3;
    margin-top: $space-8;
  }

  &__visual {
    position: relative;
    min-height: 25rem;

    > svg {
      width: 100%;
      height: 100%;
    }
  }

  &__job,
  &__profile {
    position: absolute;
    z-index: 1;
    display: grid;
    gap: $space-2;
    padding: $space-4;
    background: rgba($color-surface, 0.96);
    border: 1px solid $color-border;
    border-radius: $radius-lg;
    box-shadow: $shadow-md;
  }

  &__job {
    top: 1.5rem;
    left: 0;
    width: min(12.5rem, 48%);
    gap: $space-3;
    padding: $space-5;

    > span {
      font-size: $font-size-xs;
      font-weight: $font-weight-semibold;
      color: $color-primary;
    }

    > strong {
      font-size: $font-size-md;
      line-height: 1.35;
    }

    p {
      display: flex;
      gap: $space-2;
      align-items: center;
      font-size: $font-size-xs;
      line-height: 1.4;
      color: $color-text-secondary;

      svg {
        flex: 0 0 auto;
      }
    }

    :deep(.price-display) {
      padding-top: $space-3;
      border-top: 1px solid $color-border;
    }

    :deep(.price-display strong) {
      font-size: $font-size-lg;
    }

    :deep(.price-display span) {
      font-size: $font-size-xs;
    }
  }

  &__profile {
    right: 0;
    bottom: 1.5rem;
    display: flex;
    width: min(18rem, 78%);
    align-items: center;
  }

  &__profile-details {
    display: grid;
    min-width: 0;
    gap: $space-2;
  }

  &__profile-identity {
    display: flex;
    flex-wrap: wrap;
    gap: $space-2;
    align-items: center;

    strong {
      font-size: $font-size-sm;
      line-height: 1.35;
    }
  }

  @media (min-width: $breakpoint-lg) {
    &__inner {
      grid-template-columns: 1.05fr 0.95fr;
    }
  }
}
</style>
