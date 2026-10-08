<template>
  <section class="on-dark brand-hero relative overflow-hidden text-white">
    <BrandSparkles
      class="pointer-events-none absolute right-4 top-5 w-16 text-white sm:w-20 md:right-8 md:top-8 md:w-28 lg:right-[7vw]"
    />
    <div class="grid-container my-0 py-8 md:py-12">
      <div class="grid-container-8 flex flex-col gap-3 pr-16 sm:pr-24 md:pr-0">
        <Breadcrumb :links="breadcrumb" :current-title="title" variant="hero" />
        <slot name="title">
          <h1 class="text-4xl md:text-5xl lg:text-6xl">{{ title }}</h1>
        </slot>
        <div v-if="$slots.lead" class="mt-2 text-lg md:text-xl">
          <slot name="lead" />
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import type { BreadcrumbFragment } from '#graphql-operations'

defineProps<{
  /** Plain title, also used as the last breadcrumb item. */
  title: string
}>()

defineSlots<{
  /** Overrides the default <h1>, e.g. to make it editable in blokkli. */
  title?: () => unknown
  lead?: () => unknown
}>()

const { $texts } = useEasyTexts()
const breadcrumbLinks = useBreadcrumbLinks()

// Some routes (e.g. the news overview) come without a Drupal breadcrumb.
const breadcrumb = computed<BreadcrumbFragment[]>(() =>
  breadcrumbLinks.value.length
    ? breadcrumbLinks.value
    : [{ title: $texts('breadcrumb.home', 'Home'), url: { path: '/' } }],
)
</script>
