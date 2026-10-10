<template>
  <article
    class="group relative rounded-sm border-4 border-primary-500 p-4 text-body transition-colors duration-500 ease-in-out hover:border-primary-400 has-[:focus-visible]:border-primary-400 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-primary-500"
  >
    <p v-if="date" class="font-bold text-primary-500">
      {{ date.formatted }}
    </p>
    <h2
      class="mb-6 text-2xl font-bold leading-snug text-primary-500 md:text-3xl"
    >
      <!-- The link's ::after covers the card (and the image that hangs out
           of it on desktop), so the whole card is clickable while the
           accessible name stays the title. -->
      <VuepalLink
        v-if="url"
        :to="url.path"
        class="text-current no-underline after:absolute after:inset-0 after:z-10 focus-visible:outline-none md:after:-left-10"
      >
        {{ title }}
      </VuepalLink>
      <template v-else>{{ title }}</template>
    </h2>
    <div
      v-if="image"
      class="-mx-4 mb-6 border-y-4 border-current bg-white md:relative md:-left-10 md:float-left md:mb-2 md:mr-4 md:w-full md:max-w-xs md:border-4"
    >
      <MediaImage
        v-bind="image"
        :image-style="isPortrait ? portraitImageStyle : imageStyle"
        hide-caption
      />
    </div>
    <div v-if="teaser" class="overflow-auto text-base" v-html="teaser" />
    <div class="clear-both" />
  </article>
</template>

<script lang="ts" setup>
import type { NodePressReleaseTeaserFragment } from '#graphql-operations'

const props = defineProps<NodePressReleaseTeaserFragment>()

const sizes = {
  xs: 728,
  sm: 400,
  md: 320,
  lg: 320,
}

const imageStyle = defineImageStyle({ type: 'sizes', sizes })

// Landscape and square images keep their ratio; portrait ones are capped at
// square so a tall image can't stretch the card.
const portraitImageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 1,
  sizes,
})

const isPortrait = computed(() => {
  const { width, height } = props.image?.image?.wide ?? {}
  return !!width && !!height && height > width
})
</script>
