<template>
  <section
    class="on-dark brand-hero page-hero relative isolate overflow-hidden text-white"
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

/* Long sky: the whole hero is one sky, drawn as ONE gradient so its slope
   never jumps. It is measured up from the hero's bottom edge: the zone below
   the lead, plus a rise behind the text. The stops come from helpers/heroSky
   through tailwind.config (--page-hero-sky). Brand blue fades in
   behind the text (never fully, so the text keeps a dark background), is
   complete a little below the lead and eases into the handover colour that
   .snow-blocks starts with. Both sides reach the same blue at the same height,
   so the hero's diagonal gradient and the glow leave no band. */
.page-hero {
  --page-hero-fade: 112px;
  --page-hero-pad: theme(spacing.10);
  --page-hero-zone: calc(var(--page-hero-fade) + var(--page-hero-pad));
  --page-hero-sky-height: calc(
    var(--page-hero-zone) * (1 + var(--page-hero-rise))
  );
  --sky-from: theme(colors.brand.blue);
  --sky-to: var(--sky-handover);
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

/* Plain stops for browsers without oklch gradients, measured up from the
   bottom edge like the generated ones: blue at 70% where the lead ends
   (44.44% = zone / (rise + zone)), clear at the top of the sky. */
.page-hero::after {
  content: '';
  @apply pointer-events-none absolute inset-0 -z-[1];
  background-image: linear-gradient(
    to top,
    var(--sky-handover) 0,
    theme(colors.brand.sky) calc(var(--page-hero-sky-height) * 0.1),
    theme(colors.brand.blue) calc(var(--page-hero-sky-height) * 0.22),
    theme(colors.brand.blue / 70%) calc(var(--page-hero-sky-height) * 0.4444),
    theme(colors.brand.blue / 35%) calc(var(--page-hero-sky-height) * 0.7),
    theme(colors.brand.blue / 0%) var(--page-hero-sky-height)
  );
}

@supports (background: linear-gradient(in oklch, #000, #fff)) {
  .page-hero::after {
    background-image: var(--page-hero-sky);
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
