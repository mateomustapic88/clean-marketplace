<template>
  <article class="owner-brochure" aria-labelledby="brochure-title">
    <div class="owner-brochure__accent" aria-hidden="true" />

    <header class="owner-brochure__header">
      <a
        class="owner-brochure__brand"
        href="https://clean-marketplace.com"
        aria-label="Clean Marketplace početna stranica"
      >
        <svg viewBox="0 0 44 44" aria-hidden="true">
          <rect width="44" height="44" rx="12" fill="currentColor" />
          <path
            d="M29.4 14.2a11.6 11.6 0 1 0 0 15.7"
            fill="none"
            stroke="#fff"
            stroke-width="4.8"
            stroke-linecap="round"
          />
          <path
            d="m30.2 9.8 1.2 2.9 2.9 1.2-2.9 1.2-1.2 2.9-1.2-2.9-2.9-1.2 2.9-1.2 1.2-2.9Z"
            fill="#D9A441"
          />
        </svg>
        <strong>Clean Marketplace</strong>
      </a>
      <span class="owner-brochure__audience">Za privatne iznajmljivače</span>
    </header>

    <section class="owner-brochure__hero">
      <div class="owner-brochure__hero-copy">
        <p class="owner-brochure__eyebrow">Čišćenje apartmana, jednostavnije</p>
        <h1 id="brochure-title">
          Tražite pouzdanu osobu za čišćenje apartmana?
        </h1>
        <p>
          Clean Marketplace je nova hrvatska platforma koja povezuje iznajmljivače
          apartmana s osobama koje pružaju usluge čišćenja.
        </p>
      </div>
      <div class="owner-brochure__hero-visual" aria-hidden="true">
        <div class="owner-brochure__visual-card owner-brochure__visual-card--main">
          <span><Sparkles :size="13" /></span>
          <div>
            <small>Čišćenje apartmana</small>
            <strong>Split · 65 €</strong>
          </div>
          <Check :size="15" />
        </div>
        <div class="owner-brochure__visual-card owner-brochure__visual-card--offer">
          <div class="owner-brochure__avatar">MK</div>
          <div>
            <strong>Nova ponuda</strong>
            <small>Profil i cijena na jednom mjestu</small>
          </div>
        </div>
        <span class="owner-brochure__visual-orbit" />
      </div>
    </section>

    <section class="owner-brochure__section" aria-labelledby="benefits-title">
      <div class="owner-brochure__section-heading">
        <span>01</span>
        <div>
          <p>Prednosti platforme</p>
          <h2 id="benefits-title">Zašto koristiti Clean Marketplace?</h2>
        </div>
      </div>
      <div class="owner-brochure__benefits">
        <div
          v-for="benefit in benefits"
          :key="benefit.label"
          class="owner-brochure__benefit"
          :class="{ 'owner-brochure__benefit--featured': benefit.featured }"
        >
          <span><component :is="benefit.icon" :size="15" stroke-width="2" /></span>
          <p>{{ benefit.label }}</p>
        </div>
      </div>
    </section>

    <section class="owner-brochure__section" aria-labelledby="steps-title">
      <div class="owner-brochure__section-heading">
        <span>02</span>
        <div>
          <p>Od potrebe do dogovora</p>
          <h2 id="steps-title">Kako funkcionira?</h2>
        </div>
      </div>
      <ol class="owner-brochure__steps">
        <li v-for="(step, index) in steps" :key="step">
          <span>{{ index + 1 }}</span>
          <strong>{{ step }}</strong>
          <ChevronRight v-if="index < steps.length - 1" :size="15" aria-hidden="true" />
        </li>
      </ol>
    </section>

    <section class="owner-brochure__difference" aria-labelledby="difference-title">
      <div class="owner-brochure__difference-heading">
        <p>Razvijeno za hrvatsko tržište</p>
        <h2 id="difference-title">Zašto smo drugačiji?</h2>
      </div>
      <ul>
        <li v-for="item in differences" :key="item">
          <span><Check :size="12" stroke-width="3" /></span>
          {{ item }}
        </li>
      </ul>
    </section>

    <section class="owner-brochure__cta" aria-labelledby="cta-title">
      <div>
        <p>7 dana besplatno</p>
        <h2 id="cta-title">Isprobajte platformu već danas.</h2>
        <span>
          Registracija traje manje od dvije minute, a svaki novi korisnik ostvaruje
          7 dana besplatnog probnog razdoblja.
        </span>
        <a href="https://clean-marketplace.com">clean-marketplace.com</a>
      </div>
      <figure>
        <div>
          <img
            src="/images/clean-marketplace-qr.svg"
            alt="QR kod za otvaranje stranice clean-marketplace.com"
            width="112"
            height="112"
          >
        </div>
        <figcaption>Skenirajte i registrirajte se</figcaption>
      </figure>
    </section>

    <footer class="owner-brochure__footer">
      <strong>Clean Marketplace</strong>
      <span>cleanmarketplace.2026@gmail.com</span>
      <a href="https://clean-marketplace.com">clean-marketplace.com</a>
    </footer>
  </article>
</template>

<script setup lang="ts">
import {
  BadgeEuro,
  Check,
  ChevronRight,
  CircleUserRound,
  ClipboardPlus,
  Clock3,
  MessageCircleMore,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from '@lucide/vue'

const benefits = [
  { icon: ClipboardPlus, label: 'Objavite potrebu za čišćenjem u nekoliko minuta' },
  { icon: MessagesSquare, label: 'Primajte više ponuda' },
  { icon: BadgeEuro, label: 'Usporedite cijene prije donošenja odluke' },
  { icon: CircleUserRound, label: 'Pregledajte profile, ocjene i recenzije' },
  { icon: MessageCircleMore, label: 'Izravno komunicirajte s pružateljima usluga' },
  { icon: ShieldCheck, label: 'Bez provizije po obavljenom poslu' },
  { icon: Clock3, label: '7 dana besplatnog probnog razdoblja', featured: true },
]

const steps = [
  'Registrirajte se',
  'Objavite oglas',
  'Zaprimite ponude',
  'Odaberite najbolju ponudu',
]

const differences = [
  'Transparentnije cijene',
  'Ocjene i recenzije korisnika',
  'Jednostavnija organizacija čišćenja',
  'Bez skrivenih troškova',
  'Platforma razvijena u Hrvatskoj',
]
</script>

<style scoped lang="scss">
.owner-brochure {
  position: relative;
  display: flex;
  width: min(100%, 210mm);
  min-height: 297mm;
  padding: 12mm 13mm 8mm;
  overflow: hidden;
  flex-direction: column;
  gap: 5mm;
  color: $color-text-primary;
  background: $color-surface;
  box-shadow: $shadow-lg;

  &__accent {
    position: absolute;
    top: -30mm;
    right: -22mm;
    width: 84mm;
    height: 84mm;
    pointer-events: none;
    background:
      radial-gradient(circle at center, rgba(231, 243, 242, 0.95) 0 34%, transparent 35%),
      radial-gradient(circle at center, transparent 0 53%, rgba(35, 106, 112, 0.08) 54% 55%, transparent 56%);
    border: 1px solid rgba(35, 106, 112, 0.08);
    border-radius: 50%;
  }

  &__header,
  &__footer,
  &__section-heading,
  &__brand,
  &__hero,
  &__visual-card,
  &__benefit,
  &__steps li,
  &__difference,
  &__difference li,
  &__cta {
    display: flex;
    align-items: center;
  }

  &__header {
    position: relative;
    z-index: 1;
    justify-content: space-between;
  }

  &__brand {
    gap: 2.5mm;
    color: $color-primary-dark;
    text-decoration: none;

    svg {
      width: 10mm;
      height: 10mm;
    }

    strong {
      font-size: 4.8mm;
      line-height: 1;
      letter-spacing: -0.045em;
    }
  }

  &__audience {
    padding: 2.2mm 3.5mm;
    font-size: 2.5mm;
    font-weight: $font-weight-semibold;
    color: $color-primary-dark;
    background: rgba(255, 255, 255, 0.78);
    border: 0.25mm solid rgba(35, 106, 112, 0.16);
    border-radius: $radius-full;
  }

  &__hero {
    position: relative;
    min-height: 47mm;
    justify-content: space-between;
    background:
      linear-gradient(110deg, $color-primary-light 0 58%, rgba(231, 243, 242, 0.32) 100%);
    border-radius: 6mm;
  }

  &__hero-copy {
    position: relative;
    z-index: 2;
    width: 64%;
    padding: 7mm 0 7mm 7mm;

    h1 {
      max-width: 126mm;
      margin: 1.8mm 0 2.8mm;
      font-size: 8.3mm;
      line-height: 1.08;
      letter-spacing: -0.055em;
    }

    > p:last-child {
      max-width: 120mm;
      font-size: 3.05mm;
      line-height: 1.55;
      color: $color-text-secondary;
    }
  }

  &__eyebrow {
    font-size: 2.35mm;
    font-weight: $font-weight-bold;
    color: $color-primary;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  &__hero-visual {
    position: relative;
    width: 34%;
    height: 47mm;
    overflow: hidden;
    background:
      linear-gradient(145deg, transparent 0 46%, rgba(217, 164, 65, 0.12) 47% 48%, transparent 49%),
      radial-gradient(circle at 72% 45%, rgba(35, 106, 112, 0.16), transparent 48%);
    border-radius: 0 6mm 6mm 0;
  }

  &__visual-card {
    position: absolute;
    z-index: 2;
    gap: 2mm;
    padding: 2.5mm;
    background: rgba(255, 255, 255, 0.94);
    border: 0.25mm solid rgba(184, 198, 195, 0.65);
    border-radius: 3mm;
    box-shadow: 0 3mm 8mm rgba(23, 59, 63, 0.1);

    div:not(.owner-brochure__avatar) {
      display: grid;
      gap: 0.4mm;
    }

    strong {
      font-size: 2.6mm;
    }

    small {
      font-size: 2mm;
      color: $color-text-secondary;
    }

    &--main {
      top: 9mm;
      right: 4mm;
      width: 49mm;

      > span {
        display: grid;
        width: 7mm;
        height: 7mm;
        flex: 0 0 auto;
        color: $color-primary;
        background: $color-primary-light;
        border-radius: 2mm;
        place-items: center;
      }

      > svg {
        margin-left: auto;
        color: $color-success;
      }
    }

    &--offer {
      right: 12mm;
      bottom: 7mm;
      width: 42mm;
    }
  }

  &__avatar {
    display: grid;
    width: 8mm;
    height: 8mm;
    flex: 0 0 auto;
    font-size: 2.1mm;
    font-weight: $font-weight-bold;
    color: $color-primary-dark;
    background: $color-primary-light;
    border: 0.25mm solid rgba(35, 106, 112, 0.16);
    border-radius: 50%;
    place-items: center;
  }

  &__visual-orbit {
    position: absolute;
    top: 5mm;
    right: -12mm;
    width: 43mm;
    height: 43mm;
    border: 0.4mm solid rgba(35, 106, 112, 0.12);
    border-radius: 50%;
  }

  &__section {
    display: grid;
    gap: 3mm;
  }

  &__section-heading {
    gap: 3mm;

    > span {
      display: grid;
      width: 8mm;
      height: 8mm;
      flex: 0 0 auto;
      font-size: 2.3mm;
      font-weight: $font-weight-bold;
      color: $color-surface;
      background: $color-primary-dark;
      border-radius: 2.3mm;
      place-items: center;
    }

    div {
      display: grid;
      gap: 0.2mm;
    }

    p {
      font-size: 2.05mm;
      font-weight: $font-weight-semibold;
      color: $color-primary;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      font-size: 4.3mm;
      line-height: 1.15;
      letter-spacing: -0.035em;
    }
  }

  &__benefits {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2mm;
  }

  &__benefit {
    min-height: 12mm;
    gap: 2.2mm;
    padding: 2.2mm 3mm;
    background: #fbfcfb;
    border: 0.25mm solid $color-border;
    border-radius: 3mm;

    > span {
      display: grid;
      width: 7mm;
      height: 7mm;
      flex: 0 0 auto;
      color: $color-primary;
      background: $color-primary-light;
      border-radius: 2mm;
      place-items: center;
    }

    p {
      font-size: 2.55mm;
      font-weight: $font-weight-semibold;
      line-height: 1.35;
    }

    &--featured {
      grid-column: 1 / -1;
      min-height: 10mm;
      color: $color-primary-dark;
      background: $color-accent-light;
      border-color: rgba(217, 164, 65, 0.36);

      > span {
        color: $color-warning;
        background: rgba(255, 255, 255, 0.74);
      }
    }
  }

  &__steps {
    display: grid;
    padding: 0;
    margin: 0;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    list-style: none;
    background: #fbfcfb;
    border: 0.25mm solid $color-border;
    border-radius: 3.5mm;

    li {
      position: relative;
      min-height: 14mm;
      gap: 2mm;
      padding: 2.5mm;

      > span {
        display: grid;
        width: 7mm;
        height: 7mm;
        flex: 0 0 auto;
        font-size: 2.3mm;
        font-weight: $font-weight-bold;
        color: $color-primary-dark;
        background: $color-primary-light;
        border-radius: 50%;
        place-items: center;
      }

      strong {
        font-size: 2.45mm;
        line-height: 1.25;
      }

      > svg {
        position: absolute;
        top: 50%;
        right: -2mm;
        z-index: 2;
        color: $color-border-strong;
        background: $color-surface;
        transform: translateY(-50%);
      }
    }
  }

  &__difference {
    gap: 6mm;
    padding: 4mm 5mm;
    background: linear-gradient(100deg, #f8fbfa, $color-primary-light);
    border: 0.25mm solid rgba(35, 106, 112, 0.13);
    border-radius: 4mm;
  }

  &__difference-heading {
    width: 35%;
    flex: 0 0 auto;

    p {
      margin-bottom: 1mm;
      font-size: 2mm;
      font-weight: $font-weight-bold;
      color: $color-primary;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    h2 {
      font-size: 4.2mm;
      line-height: 1.12;
      letter-spacing: -0.035em;
    }
  }

  &__difference ul {
    display: grid;
    flex: 1;
    padding: 0;
    margin: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2mm 4mm;
    list-style: none;
  }

  &__difference li {
    gap: 1.6mm;
    font-size: 2.35mm;
    font-weight: $font-weight-semibold;

    span {
      display: grid;
      width: 5mm;
      height: 5mm;
      flex: 0 0 auto;
      color: $color-surface;
      background: $color-primary;
      border-radius: 50%;
      place-items: center;
    }
  }

  &__cta {
    justify-content: space-between;
    gap: 7mm;
    padding: 5mm 6mm;
    color: $color-surface;
    background:
      radial-gradient(circle at 82% 18%, rgba(255, 255, 255, 0.08) 0 18%, transparent 19%),
      $color-primary-dark;
    border-radius: 5mm;

    > div {
      flex: 1;
    }

    p {
      margin-bottom: 1.2mm;
      font-size: 2.15mm;
      font-weight: $font-weight-bold;
      color: #e7cf91;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h2 {
      margin-bottom: 1.6mm;
      font-size: 5mm;
      letter-spacing: -0.04em;
    }

    div > span {
      display: block;
      max-width: 118mm;
      margin-bottom: 3mm;
      font-size: 2.4mm;
      line-height: 1.5;
      color: rgba(255, 255, 255, 0.76);
    }

    div > a {
      display: inline-flex;
      padding: 2.4mm 4.2mm;
      font-size: 2.55mm;
      font-weight: $font-weight-bold;
      color: $color-primary-dark;
      text-decoration: none;
      background: $color-surface;
      border-radius: $radius-full;
    }

    figure {
      display: grid;
      width: 31mm;
      flex: 0 0 auto;
      margin: 0;
      gap: 1.2mm;
      text-align: center;
    }

    figure > div {
      display: grid;
      width: 25mm;
      height: 25mm;
      margin-inline: auto;
      overflow: hidden;
      background: $color-surface;
      border: 1.5mm solid $color-surface;
      border-radius: 2.5mm;
      place-items: center;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
    }

    figcaption {
      font-size: 1.85mm;
      font-weight: $font-weight-semibold;
      line-height: 1.3;
      color: rgba(255, 255, 255, 0.82);
    }
  }

  &__footer {
    margin-top: auto;
    justify-content: center;
    gap: 4mm;
    font-size: 2.05mm;
    color: $color-text-secondary;

    strong {
      color: $color-primary-dark;
    }

    span::before,
    a::before {
      margin-right: 4mm;
      color: $color-border-strong;
      content: '•';
    }

    a {
      color: inherit;
      text-decoration: none;
    }
  }
}

@media (max-width: 48rem) {
  .owner-brochure {
    min-width: 210mm;
  }
}

@media print {
  .owner-brochure {
    width: 210mm;
    height: 297mm;
    min-height: 297mm;
    box-shadow: none;
    break-after: avoid;
    break-inside: avoid;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
}
</style>
