<template>
  <article
    class="gradient-border group relative flex h-full flex-col overflow-hidden rounded-[18px] transition-shadow hover:shadow-lg has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-primary-500 motion-reduce:transition-none"
  >
    <MediaImage
      v-if="image"
      v-bind="image"
      :image-style="imageStyle"
      :sizes="imageSizes"
      :loading="preload ? 'eager' : 'lazy'"
      :preload="preload"
      hide-caption
    />
    <div
      v-else
      class="brand-card-header flex aspect-video items-center justify-center"
      aria-hidden="true"
    >
      <BrandSparkles class="w-24 text-white" />
    </div>
    <div class="flex flex-col gap-2 p-5">
      <p v-if="date" class="text-sm font-medium text-primary-400">
        {{ date.formatted }}
      </p>
      <component
        :is="headingTag"
        class="text-xl font-bold leading-snug text-primary-500"
      >
        <!-- The link's ::after covers the card, so the whole card is clickable
             while the accessible name stays the title. -->
        <VuepalLink
          v-if="url"
          :to="url.path"
          class="text-current no-underline after:absolute after:inset-0 focus-visible:outline-none group-hover:underline"
        >
          {{ title }}
        </VuepalLink>
        <template v-else>{{ title }}</template>
      </component>
      <div v-if="teaser" class="line-clamp-3 text-base" v-html="teaser" />
    </div>
  </article>
</template>

<script lang="ts" setup>
import type { NodePressReleaseTeaserFragment } from '#graphql-operations'

withDefaults(
  defineProps<
    NodePressReleaseTeaserFragment & {
      headingTag?: 'h2' | 'h3'
      // How wide the card is in the grid that holds it.
      imageSizes?: string
      // For the one card whose image is in the first viewport.
      preload?: boolean
    }
  >(),
  { headingTag: 'h3', imageSizes: undefined, preload: false },
)

const imageStyle = defineImageStyle({
  type: 'sizes',
  aspectRatio: 16 / 9,
  sizes: {
    xs: 728,
    sm: 640,
    md: 400,
    lg: 400,
  },
})
</script>
