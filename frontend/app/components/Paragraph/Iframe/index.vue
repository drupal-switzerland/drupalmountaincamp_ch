<template>
  <div :class="paragraphClassList">
    <iframe
      :src="src"
      :title="$texts('iframe.title', 'Embedded content')"
      loading="lazy"
      :class="{ 'pointer-events-none': isEditing }"
      class="w-full"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ParagraphIframeFragment } from '#graphql-operations'

const isEditing = import.meta.blokkliEditing
const { $texts } = useEasyTexts()
const { options } = defineBlokkli({
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
