<template>
  <NodePageLanding v-if="node" v-bind="node" is-front />
</template>

<script lang="ts" setup>
import type { NodePageFragment } from '#graphql-operations'
import { buildEventSchema } from '~/helpers/eventSchema'
import { canonicalPageUrl } from '~/helpers/pagination'
import { SITE_TITLE } from '~/helpers/site'

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
const { entity: node } = await useDrupalRoute<NodePageFragment>(
  query.value ?? null,
)

// Drupal's node title pattern would repeat the brand ("… | Mountain Camp"),
// and its canonical and og:url point to the /home alias, which redirects to
// "/". Unhead keeps one canonical link, so this replaces Drupal's.
const homeUrl = canonicalPageUrl(useSiteOrigin().value, '/', 1)
useSeoMeta({ ogUrl: homeUrl })

useHead({
  title: SITE_TITLE,
  link: [
    {
      rel: 'canonical',
      href: homeUrl,
    },
  ],
  script: [
    {
      key: 'event-schema',
      type: 'application/ld+json',
      innerHTML: JSON.stringify(buildEventSchema()),
    },
  ],
})

setBreadcrumbLinksFromRoute(query.value ?? null)
setPageHasHero(false)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
