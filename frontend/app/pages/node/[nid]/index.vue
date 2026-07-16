<template>
  <div>
    <NodePage v-if="node && pageType === 'NodePage'" v-bind="node" />
    <NodePressRelease
      v-else-if="node && pageType === 'NodePressRelease'"
      v-bind="node"
    />
  </div>
</template>

<script lang="ts" setup>
import type {
  EntityUrlFragment,
  NodePageFragment,
  NodePressReleaseFragment,
} from '#graphql-operations'

defineOptions({
  name: 'PageNodeCanonical',
})

definePageMeta({
  name: 'node-canonical',
})

const nuxtRoute = useRoute()

const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('routeNodeCanonical', {
    path: nuxtRoute.path,
  }).then((v) => {
    return v.data
  })
})

const pageType = computed(() => {
  const route = query?.value?.route as EntityUrlFragment
  return route.entityGlobal?.__typename
})

const { entity: node } = await useDrupalRoute<
  NodePageFragment | NodePressReleaseFragment
>(query.value ?? null)

setBreadcrumbLinksFromRoute(query.value ?? null)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
