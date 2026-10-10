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

/* Long sky: the whole hero is one sky. Brand blue fades in behind the text
   (never fully, so the text keeps a dark background), is complete just below
   the lead and then eases into the handover colour that .snow-blocks starts
   with. Both sides reach the same blue at the same height, so the hero's
   diagonal gradient and the glow leave no band. */
.page-hero {
  --page-hero-fade: 112px;
  --page-hero-pad: theme(spacing.10);
  --page-hero-zone: calc(var(--page-hero-fade) + var(--page-hero-pad));
  padding-bottom: var(--page-hero-fade);

  @screen md {
    --page-hero-fade: 150px;
    --page-hero-pad: theme(spacing.16);
  }

  @screen lg {
    --page-hero-fade: 180px;
    --page-hero-pad: theme(spacing.20);
  }
}

.page-hero::after {
  content: '';
  @apply pointer-events-none absolute inset-0 -z-[1];
  background:
    linear-gradient(
        to bottom,
        theme(colors.brand.blue / 70%) 0%,
        theme(colors.brand.blue) 14%,
        theme(colors.brand.sky) 55%,
        var(--sky-handover) 100%
      )
      bottom / 100% var(--page-hero-zone) no-repeat,
    linear-gradient(
        to bottom,
        theme(colors.brand.blue / 0%),
        theme(colors.brand.blue / 70%)
      )
      top / 100% calc(100% - var(--page-hero-zone)) no-repeat;
}

/* Eased stops, mixed in oklch so the midtones stay blue instead of grey. */
@supports (background: linear-gradient(in oklch, #000, #fff)) {
  .page-hero::after {
    --sky-from: theme(colors.brand.blue);
    --sky-to: var(--sky-handover);
    background:
      linear-gradient(
          to bottom in oklch,
          theme(colors.brand.blue / 70%) 0%,
          var(--sky-from) 14%,
          color-mix(in oklch, var(--sky-to) 5.5%, var(--sky-from)) 26.3%,
          color-mix(in oklch, var(--sky-to) 19.8%, var(--sky-from)) 38.6%,
          color-mix(in oklch, var(--sky-to) 39.7%, var(--sky-from)) 50.9%,
          color-mix(in oklch, var(--sky-to) 60.3%, var(--sky-from)) 63.1%,
          color-mix(in oklch, var(--sky-to) 80.2%, var(--sky-from)) 75.4%,
          color-mix(in oklch, var(--sky-to) 94.5%, var(--sky-from)) 87.7%,
          var(--sky-to) 100%
        )
        bottom / 100% var(--page-hero-zone) no-repeat,
      linear-gradient(
          to bottom,
          theme(colors.brand.blue / 0%) 0%,
          theme(colors.brand.blue / 7.3%) 20%,
          theme(colors.brand.blue / 24.6%) 40%,
          theme(colors.brand.blue / 45.4%) 60%,
          theme(colors.brand.blue / 62.7%) 80%,
          theme(colors.brand.blue / 70%) 100%
        )
        top / 100% calc(100% - var(--page-hero-zone)) no-repeat;
  }
}

/* A dark band right after the hero: light blue between the two would read as
   a stripe, so the hero keeps its straight edge. */
.page-hero:has(+ * > .snow-blocks > :is(.navy-band, .week-band):first-child) {
  --page-hero-fade: 0px;

  &::after {
    content: none;
  }
}

/* A band that starts in plain ice: hand over in ice, so its top edge
   doesn't show. */
.page-hero:has(+ * > .snow-blocks > :is(.news-band, .theme-band):first-child) {
  --sky-handover: theme(colors.brand.ice);
}

/* The lead is ice, so its links need more than colour to stand out. */
.page-hero-lead a {
  @apply text-white underline underline-offset-4;
}
</style>
