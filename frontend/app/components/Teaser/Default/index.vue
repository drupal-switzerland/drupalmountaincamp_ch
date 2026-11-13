<template>
  <VuepalLink
    :to="to"
    class="gradient-border group flex h-full flex-col overflow-hidden rounded-[18px] text-start"
  >
    <div class="mb-5">
      <MediaImage
        v-if="media"
        v-bind="media"
        :image-style="imageStyle"
        hide-caption
      />
    </div>
    <component :is="heading" class="mb-3 px-5 text-xl font-medium md:text-2xl">
      {{ title }}
    </component>
    <div v-if="text" class="mb-5 grow px-5" v-html="text" />
    <p class="mb-5 inline-flex px-5 font-bold">
      {{ $texts('more_information', 'More information') }}

      <SpriteSymbol
        name="arrow-right"
        class="size-6 max-w-0 -translate-x-0.5 opacity-0 transition-all duration-250 ease-in-out [.teaser:hover_&]:max-w-6 [.teaser:hover_&]:translate-x-0 [.teaser:hover_&]:opacity-100"
      />
    </p>
  </VuepalLink>
</template>

<script lang="ts" setup>
import type { MediaImageFragment } from '#graphql-operations'
import { TEASER_HEADING } from '~/composables/teaserHeading'

defineProps<{
  title: string
  text?: string
  to: string
  media?: MediaImageFragment
}>()

const { $texts } = useNuxtApp()

const heading = inject(
  TEASER_HEADING,
  computed(() => 'h3' as const),
)

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 4 / 3,
  sizes: {
    xs: 728,
    sm: 1000,
    md: 912,
    lg: 912,
  },
})
</script>
