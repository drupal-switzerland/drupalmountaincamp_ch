<template>
  <div :class="paragraphClassList">
    <IframeResizer
      license="GPLv3"
      :src="src"
      :class="{ 'pointer-events-none': isEditing }"
      class="w-full"
    />
  </div>
</template>

<script lang="ts" setup>
import IframeResizer from '@iframe-resizer/vue/iframe-resizer.vue'
import '@iframe-resizer/child'
import type { ParagraphIframeFragment } from '#graphql-operations'

const { isEditing, options } = defineBlokkli({
  bundle: 'iframe',
  globalOptions: ['spacing'],
})

const props = defineProps<{
  url?: ParagraphIframeFragment['url']
}>()

const paragraphClassList = computed(() => {
  const classList = []

  if (options.value.spacing === 'small') {
    classList.push('py-6', 'lg:py-10')
  } else if (options.value.spacing === 'large') {
    classList.push('py-12', 'lg:py-20')
  }

  return classList
})

const src = computed(() => props.url?.uri?.path || '')
</script>

<style scoped>
iframe {
  width: 100%;
  height: 100vh;
}
</style>
