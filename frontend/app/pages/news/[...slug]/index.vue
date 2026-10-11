<template>
  <NodePressRelease v-if="node" v-bind="node" />
</template>

<script lang="ts" setup>
import type { NodePressReleaseFragment } from '#graphql-operations'
import { NEWS_OVERVIEW_PATH } from '~/helpers/navigation'

defineOptions({
  name: 'PagePressReleaseSlug',
})

definePageMeta({
  name: 'press-release-detail',
})

const { $texts } = useEasyTexts()
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
if (node.value) {
  setBreadcrumbLinks(
    withBreadcrumbLink(useBreadcrumbLinks().value, {
      title: $texts('news.title', 'News'),
      url: { path: NEWS_OVERVIEW_PATH },
    }),
  )
}
setPageHasHero(false)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
