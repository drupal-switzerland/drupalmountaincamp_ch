<template>
  <VuepalLink
    v-if="url"
    :to="url.path"
    class="teaser__link group block text-body no-underline"
  >
    <article
      class="rounded-sm border-4 border-primary-500 p-4 transition-colors duration-500 ease-in-out group-hover:border-error-500 group-focus:border-error-500"
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
        class="-mx-4 mb-6 border-b-4 border-t-4 border-current md:relative md:-left-10 md:float-left md:mb-2 md:mr-4 md:max-w-xs md:border-4"
      >
        <MediaImage v-bind="image" :image-style="imageStyle" hide-caption />
      </div>
      <div v-if="teaser" class="overflow-auto text-base" v-html="teaser" />
      <div class="clear-both" />
    </article>
  </VuepalLink>
</template>

<script lang="ts" setup>
import type { NodePressReleaseTeaserFragment } from '#graphql-operations'

defineProps<NodePressReleaseTeaserFragment>()

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 1,
  sizes: {
    xs: 728,
    sm: 400,
    md: 320,
    lg: 320,
  },
})
</script>
