<template>
  <VuepalLink
    v-if="url"
    :to="url.path"
    class="group block text-body no-underline"
  >
    <article
      class="rounded-sm border-4 border-primary-500 p-4 transition-colors duration-500 ease-in-out group-hover:border-primary-400 group-focus:border-primary-400"
    >
      <p v-if="date" class="font-bold text-primary-500">
        {{ date.formatted }}
      </p>
      <h2
        class="mb-6 text-2xl font-bold leading-snug text-primary-500 md:text-3xl"
      >
        {{ title }}
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
  </VuepalLink>
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
