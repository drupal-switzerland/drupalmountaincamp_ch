<template>
  <section
    class="on-dark brand-hero page-hero relative isolate overflow-hidden text-white"
  >
    <div class="grid-container my-0 py-10 md:py-16 lg:py-20">
      <div
        class="grid-container-8 flex flex-col items-center gap-3 text-center md:gap-4"
      >
        <Breadcrumb :links="breadcrumb" :current-title="title" variant="hero" />
        <BrandSparkles class="w-14 text-white xs:w-16 md:w-20 lg:w-24" />
        <slot name="title" :title-class="TITLE_CLASS">
          <h1 :class="TITLE_CLASS">{{ title }}</h1>
        </slot>
        <ThemeLine class="text-2xl xs:text-3xl md:text-4xl lg:text-[2.75rem]" />
        <div
          v-if="$slots.lead"
          class="page-hero-lead mt-1 max-w-2xl text-lg text-primary-100 md:text-xl lg:text-2xl"
        >
          <slot name="lead" />
        </div>
      </div>
    </div>
    <BrandRidge mirrored cropped class="page-hero-ridge" />
  </section>
</template>

<script lang="ts" setup>
import type { BreadcrumbFragment } from '#graphql-operations'

defineProps<{
  /** Plain title, also used as the last breadcrumb item. */
  title: string
}>()

const TITLE_CLASS =
  'max-w-full text-[length:min(2.625rem,13.125vw)] leading-none [text-wrap:balance] xs:text-6xl md:text-7xl'

defineSlots<{
  /** Overrides the default <h1>, e.g. to make it editable in blokkli. */
  title?: (props: { titleClass: string }) => unknown
  lead?: () => unknown
}>()

const { $texts } = useEasyTexts()
const breadcrumbLinks = useDisplayedBreadcrumbLinks()

// Some routes (e.g. the news overview) come without a Drupal breadcrumb.
const breadcrumb = computed<BreadcrumbFragment[]>(() =>
  breadcrumbLinks.value.length
    ? breadcrumbLinks.value
    : [{ title: $texts('breadcrumb.home', 'Home'), url: { path: '/' } }],
)
</script>

<style lang="postcss">
/* Long sky: the whole hero is one sky, drawn as ONE gradient so its slope
   never jumps. It is measured up from the hero's bottom edge: the zone below the
   lead, plus a rise behind the text. The stops come from helpers/heroSky
   through tailwind.config (--page-hero-sky), the horizon the homepage hero
   shares: brand blue fades in behind the text (never fully, so the ice lead
   keeps a dark background) and from the end of the lead turns sky behind the
   ridge and eases into the handover colour. Both sides reach the same blue at
   the same height, so the hero's diagonal gradient leaves no band. The zone
   below the lead is the ridge's height, so the ridge stands in it. */
.page-hero {
  --page-hero-fade: var(--ridge-height-narrow);
  --page-hero-pad: theme(spacing.10);
  --page-hero-zone: calc(var(--page-hero-fade) + var(--page-hero-pad));
  --page-hero-sky-height: calc(
    var(--page-hero-zone) * (1 + var(--page-hero-rise))
  );
  --sky-from: theme(colors.brand.blue);
  --sky-mid: theme(colors.brand.sky);
  --sky-to: var(--sky-handover);
  /* The hero's bottom edge rarely lands on a whole device pixel at 125% or
     150% scaling. The browser then covers the last pixel row only partly with
     the ridge and the section below, so whatever is under them shows as a
     line: the box's own background, and through that the page behind the
     hero. The dark gradient therefore stops --page-hero-edge above the edge,
     where the box's own colour, the ridge's ice, takes over, and the box's
     shadow puts that colour behind the edge row. The next section paints
     over the shadow. */
  --page-hero-edge: 2px;
  --page-hero-backdrop: 1px;
  --page-hero-edge-colour: theme(colors.brand.ice);
  padding-bottom: var(--page-hero-fade);

  @screen md {
    --page-hero-pad: theme(spacing.16);
  }

  @screen lg {
    --page-hero-pad: theme(spacing.20);
  }
}

/* Both classes, so this wins over .brand-hero's background whichever of the
   two stylesheets loads first. */
.brand-hero.page-hero {
  background: var(--brand-hero-gradient) top / 100%
    calc(100% - var(--page-hero-edge)) no-repeat var(--page-hero-edge-colour);
  box-shadow: 0 var(--page-hero-backdrop) 0 var(--page-hero-edge-colour);
}

/* Plain stops from the same curve for browsers without oklch gradients. */
.page-hero::after {
  content: '';
  @apply pointer-events-none absolute inset-0 -z-[1];
  background-image: var(--page-hero-sky-fallback);
}

@supports (background: linear-gradient(in oklch, #000, #fff)) {
  .page-hero::after {
    background-image: var(--page-hero-sky);
  }
}

.page-hero-ridge {
  @apply absolute inset-x-0 bottom-0;
}

/* Centred like the title; "safe" starts a trail too long for the row at its
   left edge, so the breadcrumb can scroll to its end. */
.page-hero .breadcrumb ol {
  justify-content: safe center;
}

/* The lead is ice, so its links need more than colour to stand out. */
.page-hero-lead a {
  @apply text-white underline underline-offset-4;
}
</style>
