<template>
  <NodePressRelease v-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
import type { NodePressReleaseFragment } from '#graphql-operations'

defineOptions({
  name: 'PagePressReleaseSlug',
})

definePageMeta({
  name: 'press-release-detail',
})

const nuxtRoute = useRoute()

const query = await useRouteQuery(nuxtRoute.path, () =>
  useGraphqlQuery('routeNodePressRelease', { path: nuxtRoute.path }).then(
    (v) => v.data,
  ),
)

const { entity: node } = await useDrupalRoute<NodePressReleaseFragment>(
  query.value ?? null,
)

setBreadcrumbLinksFromRoute(query.value ?? null)
setPageHasHero(false)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
