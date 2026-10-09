<template>
  <section class="on-dark brand-hero relative overflow-hidden text-white">
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
          class="mt-1 max-w-2xl text-lg text-primary-100 md:text-xl lg:text-2xl"
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
  @apply relative isolate w-16 shrink-0 xs:w-20 md:w-28 xl:w-36;
}

/* Centred on the marks, so the light follows them when the title wraps. */
.page-hero-glow {
  @apply pointer-events-none absolute left-1/2 top-1/2 -z-10;
  width: 360%;
  height: 440%;
  transform: translate(-50%, -50%);
}
</style>
