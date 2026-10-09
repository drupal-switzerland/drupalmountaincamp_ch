<template>
  <NodePageLanding v-if="node" v-bind="node" is-front />
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
const { data: query, error: queryError } = await useAsyncData(
  nuxtRoute.path,
  async () => {
    return await useGraphqlQuery('route', {
      path: '/home',
    }).then((v) => {
      return v.data
    })
  },
)

// A failed request (e.g. Drupal down, 503) is not a missing page: keep its
// status instead of letting useDrupalRoute turn the empty result into a 404.
if (queryError.value) {
  throw createError({
    statusCode: queryError.value.statusCode || 500,
    statusMessage: queryError.value.statusMessage,
    fatal: true,
  })
}

// Handles redirects and metatags.
const { entity: node } = await useDrupalRoute<NodePageFragment>(
  query.value ?? null,
)

setBreadcrumbLinksFromRoute(query.value ?? null)
setPageHasHero(false)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
