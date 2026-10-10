<template>
  <section
    class="page-hero on-dark brand-hero relative isolate overflow-hidden text-white"
  >
    <div class="grid-container my-0 py-10 md:py-16 lg:py-20">
      <div class="grid-container-8 flex flex-col gap-3 md:gap-4">
        <Breadcrumb :links="breadcrumb" :current-title="title" variant="hero" />
        <!-- The plus marks share the title's row so they line up with it at every width. -->
        <div class="flex items-center justify-between gap-4 md:gap-10">
          <slot name="title" :title-class="TITLE_CLASS">
            <h1 :class="TITLE_CLASS">{{ title }}</h1>
          </slot>
          <div class="page-hero-marks">
            <span
              class="page-hero-glow"
              :style="{ backgroundImage: glow }"
              aria-hidden="true"
            />
            <BrandSparkles class="relative w-full text-white" />
          </div>
        </div>
        <div
          v-if="$slots.lead"
          class="page-hero-lead mt-1 max-w-2xl text-lg text-primary-100 md:text-xl lg:text-2xl"
        >
          <slot name="lead" />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { BreadcrumbFragment } from '#graphql-operations'
import { heroGlowGradient } from '~/helpers/heroGlow'

defineProps<{
  /** Plain title, also used as the last breadcrumb item. */
  title: string
}>()

const TITLE_CLASS =
  'text-[2.625rem] leading-none [text-wrap:balance] xs:text-6xl md:text-7xl'

defineSlots<{
  /** Overrides the default <h1>, e.g. to make it editable in blokkli. */
  title?: (props: { titleClass: string }) => unknown
  lead?: () => unknown
}>()

const { $texts } = useEasyTexts()
const breadcrumbLinks = useDisplayedBreadcrumbLinks()
const glow = heroGlowGradient()

// Some routes (e.g. the news overview) come without a Drupal breadcrumb.
const breadcrumb = computed<BreadcrumbFragment[]>(() =>
  breadcrumbLinks.value.length
    ? breadcrumbLinks.value
    : [{ title: $texts('breadcrumb.home', 'Home'), url: { path: '/' } }],
)
</script>

<style lang="postcss">
.page-hero-marks {
  @apply relative w-16 shrink-0 xs:w-20 md:w-28 xl:w-36;
}

/* Centred on the marks, so the light follows them when the title wraps.
   Negative z-index inside the section's stacking context: above the hero
   background, below the title, breadcrumb and lead it overlaps. */
.page-hero-glow {
  @apply pointer-events-none absolute left-1/2 top-1/2 -z-10;
  width: 360%;
  height: 440%;
  transform: translate(-50%, -50%);
}

/* Fade into snow: below the text the hero runs into the ice that .snow-blocks
   starts with, so there is no edge between the two. The text keeps today's
   dark background: the fade only covers the padding added for it. */
.page-hero {
  --page-hero-fade: 56px;
  padding-bottom: var(--page-hero-fade);

  @screen md {
    --page-hero-fade: 88px;
  }

  @screen lg {
    --page-hero-fade: 104px;
  }
}

.page-hero::after {
  content: '';
  @apply pointer-events-none absolute inset-x-0 bottom-0 -z-[1];
  height: calc(var(--page-hero-fade) + theme(spacing.6));
  background: linear-gradient(
    to bottom,
    theme(colors.brand.ice / 0%) 0%,
    theme(colors.brand.ice / 18%) 30%,
    theme(colors.brand.ice / 60%) 65%,
    theme(colors.brand.ice) 100%
  );
}

/* A dark band right after the hero: ice between the two would read as a
   stripe, so the hero keeps its straight edge. */
.page-hero:has(+ * > .snow-blocks > :is(.navy-band, .week-band):first-child) {
  --page-hero-fade: 0px;

  &::after {
    content: none;
  }
}

/* The lead is ice, so its links need more than colour to stand out. */
.page-hero-lead a {
  @apply text-white underline underline-offset-4;
}
</style>
