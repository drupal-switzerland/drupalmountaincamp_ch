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

// Get the data. Query the front node's alias instead of "/" — Drupal's route
// resolver answers "/" with a 301 RedirectUrl to the alias (and no entity),
// while the alias itself resolves to the entity. /home redirects to "/" in
// middleware/frontpage.global.ts.
const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('route', {
    path: '/home',
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
