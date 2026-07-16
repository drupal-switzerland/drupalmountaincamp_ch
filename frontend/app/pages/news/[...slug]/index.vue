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

const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('routeNodePressRelease', {
    path: nuxtRoute.path,
  }).then((v) => {
    return v.data
  })
})

const { entity: node } = await useDrupalRoute<NodePressReleaseFragment>(
  query.value ?? null,
)

setBreadcrumbLinksFromRoute(query.value ?? null)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
