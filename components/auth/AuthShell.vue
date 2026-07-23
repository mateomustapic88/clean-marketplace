<template>
  <section class="auth-shell">
    <div class="auth-shell__decor" aria-hidden="true">
      <span class="auth-shell__spark auth-shell__spark--large" />
      <span class="auth-shell__spark auth-shell__spark--small" />
    </div>
    <div class="auth-shell__container container">
      <div class="auth-shell__intro">
        <BaseBadge variant="premium">{{ eyebrow }}</BaseBadge>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <slot name="aside" />
      </div>
      <BaseCard class="auth-shell__card">
        <slot />
      </BaseCard>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<style scoped lang="scss">
.auth-shell {
  position: relative;
  display: grid;
  min-height: calc(100vh - $header-height);
  overflow: hidden;
  background:
    radial-gradient(circle at 15% 15%, rgba($color-accent, 0.12), transparent 20rem),
    linear-gradient(145deg, $color-primary-light, $color-background 60%);

  &__decor {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &__spark {
    position: absolute;
    display: block;
    background: $color-accent;
    opacity: 0.55;
    transform: rotate(45deg);

    &--large {
      top: 12%;
      right: 8%;
      width: 2rem;
      height: 2rem;
      border-radius: $radius-sm;
    }

    &--small {
      bottom: 10%;
      left: 7%;
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 0.2rem;
    }
  }

  &__container {
    position: relative;
    z-index: 1;
    display: grid;
    gap: $space-8;
    align-items: center;
    padding-block: $space-12;
  }

  &__intro {
    display: grid;
    gap: $space-4;

    h1 {
      max-width: 42rem;
      font-size: $font-size-3xl;
      line-height: 1.08;
      letter-spacing: -0.04em;
    }

    p {
      max-width: 38rem;
      color: $color-text-secondary;
    }
  }

  &__card {
    width: 100%;
    max-width: 36rem;
    justify-self: center;
    box-shadow: $shadow-md;
  }
}

@media (min-width: $breakpoint-lg) {
  .auth-shell {
    &__container {
      grid-template-columns: 1fr minmax(26rem, 0.8fr);
      gap: $space-16;
      padding-block: $space-20;
    }

    &__card {
      justify-self: end;
    }
  }
}
</style>
