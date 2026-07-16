<template>
  <!-- Pages with a hero image get the landing treatment (e.g. the front
       page, which Drupal serves via its alias after the / redirect). -->
  <NodePageLanding v-if="node?.hero" v-bind="node" />
  <NodePage v-else-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

defineOptions({
  name: 'PageSlug',
})

definePageMeta({
  name: 'drupal-route',
  path: '/:slug(.*)*',
})

const nuxtRoute = useRoute()

// Get the data.
const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('route', {
    path: nuxtRoute.path,
  }).then((v) => {
    return v.data
  })
})

// Handles redirects and metatags.
const { entity: node } = await useDrupalRoute<NodePageFragment>(query.value ?? null)

setBreadcrumbLinksFromRoute(query.value ?? null)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
