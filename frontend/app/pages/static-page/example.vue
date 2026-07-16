<template>
  <div class="container">
    <h1 class="mb-10 text-4xl">Static Page example</h1>
    <h2>{{ node.title }}</h2>
  </div>
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'

defineOptions({
  name: 'StaticPageExample',
})

definePageMeta({
  name: 'static-page-example',
  drupalFrontendRoute: true,
})

const nuxtRoute = useRoute()

// Get the data.
const { data: query } = await useAsyncData('staticPageExample', async () => {
  return await useGraphqlQuery('route', {
    path: nuxtRoute.path,
  }).then((v) => v.data)
})

// Handles redirects and metatags.
const { entity: node } = await useDrupalRoute<NodePageFragment>(query.value ?? null)

setBreadcrumbLinks()
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
