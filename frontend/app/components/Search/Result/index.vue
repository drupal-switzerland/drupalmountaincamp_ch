<template>
  <!-- Always use this component in an <ol> -->
  <li>
    <VuepalLink
      v-if="langcode === language"
      :to="url"
      class="search-result link group block py-6"
    >
      <div class="flex items-center gap-5">
        <h2
          class="line-clamp-2 text-2xl text-primary-500 group-hover:text-primary-400 lg:text-3xl"
          v-html="title"
        />
      </div>
      <div
        v-if="text"
        class="col-start-2 mt-5 line-clamp-3 text-primary-400"
        v-html="text"
      />
    </VuepalLink>
  </li>
</template>

<script lang="ts" setup>
import { useCurrentLanguage } from '#imports'

const language = useCurrentLanguage()
defineProps<{
  title: string
  text?: string
  id?: string
  langcode?: string
  url: string
}>()
</script>

<style lang="postcss">
.search-result em {
  @apply font-bold not-italic;
}
</style>
