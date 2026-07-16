<template>
  <svg :aria-label="alt" :width="width" :height="height">
    <use :xlink:href="url" width="100%" height="100%" />
  </svg>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue'
import { slugify } from '#vuepal/helpers/url'
import type { MediaIconFragment } from '#graphql-operations'

const props = defineProps({
  // eslint-disable-next-line vue/prop-name-casing
  __typename: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  changed: {
    type: Object as PropType<MediaIconFragment['changed']>,
    default: null,
  },
  svg: {
    type: Object as PropType<MediaIconFragment['svg']>,
    default: null,
  },
})

const alt = computed(() => props.svg?.first?.alt || '')
const width = computed(() => props.svg?.first?.width?.toString())
const height = computed(() => props.svg?.first?.height?.toString())

const url = computed(() => {
  const changed = props.changed?.first?.formatted || ''
  return `/api/icon/${props.id}--${slugify(alt.value)}.svg?h=${changed}#icon`
})

defineOptions({
  name: 'MediaIcon',
})
</script>
