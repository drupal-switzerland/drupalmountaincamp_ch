<template>
  <VuepalLink :to="to" class="group flex flex-col text-start">
    <div class="mb-5">
      <MediaImage
        v-if="media"
        v-bind="media"
        :image-style="imageStyle"
        hide-caption
      />
    </div>
    <h3 class="mb-3 px-5 text-xl md:text-2xl">
      {{ title }}
    </h3>
    <div v-if="text" class="mb-5 grow px-5" v-html="text" />
    <p class="mb-5 inline-flex px-5 font-bold">
      {{ $texts('more_information', 'Mehr Informationen') }}

      <SpriteSymbol
        name="arrow-right"
        class="size-6 max-w-0 -translate-x-0.5 opacity-0 transition-all duration-250 ease-in-out [.teaser:hover_&]:max-w-6 [.teaser:hover_&]:translate-x-0 [.teaser:hover_&]:opacity-100"
      />
    </p>
  </VuepalLink>
</template>

<script lang="ts" setup>
import type { MediaImageFragment } from '#graphql-operations'

defineProps<{
  title: string
  text?: string
  to: string
  media?: MediaImageFragment
}>()

const { $texts } = useNuxtApp()

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
