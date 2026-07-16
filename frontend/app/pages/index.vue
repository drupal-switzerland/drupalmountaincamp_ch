<template>
  <NodePageLanding v-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

defineOptions({
  name: 'Homepage',
})

definePageMeta({
  name: 'home',
  hideBreadcrumb: true,
  languageMapping: {},
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
