<template>
  <div
    class="flex flex-col border transition-[border-color] duration-250 ease-in-out"
  >
    <TeaserDefault
      v-if="url && title"
      :to="url"
      :title="title"
      :text="text"
      :media="media"
    />
  </div>
</template>

<script lang="ts" setup>
/**
 * This paragraph has a link field that allowed both internal and external links.
 * In case of external links, the title, text and media fields are required. For
 * internal links, they are optional.
 *
 * The title, text and media fields should always be used as the primary source.
 * If the link is internal we can fallback to the linked entity's teaser data.
 */
import type { ParagraphTeaserFragment } from '#graphql-operations'

const props = defineProps<{
  title?: ParagraphTeaserFragment['title']
  node?: ParagraphTeaserFragment['node']
}>()

defineBlokkli({
  bundle: 'teaser',
  editor: {
    editTitle: (el) => el.querySelector('h3')?.innerText,
    mockProps: (text) => {
      return {
        overrideTitle: text || 'Teaser Titel',
        link: {
          uri: {
            path: '/',
          },
        },
      }
    },
  },
})

const title = computed(() => {
  if (props.title) {
    return props.title
  }
  if (props.node && props.node?.teaserTitle) {
    return props.node?.teaserTitle
  }
  return ''
})

const text = computed(() => {
  if (props.node && props.node?.teaserText) {
    return props.node?.teaserText
  }
  return ''
})

const media = computed(() => {
  if (props.node && props.node?.teaserImage) {
    return props.node?.teaserImage
  }
  return undefined
})

const url = computed(() => {
  return props.node?.url?.path || ''
})
</script>
