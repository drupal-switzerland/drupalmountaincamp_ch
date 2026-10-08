<template>
  <div>
    <PageHero :title="entity?.title || 'News'" />

    <div class="container">
      <div v-if="pressReleases.length" class="mx-auto max-w-3xl space-y-10">
        <NodePressReleaseTeaser
          v-for="item in pressReleases"
          :key="item.uuid"
          v-bind="item"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  NodePressReleaseTeaserFragment,
  NodePageFragment,
} from '#graphql-operations'

defineOptions({
  name: 'PageNewsOverview',
})

definePageMeta({
  name: 'news-overview',
})

const nuxtRoute = useRoute()

const { data: query } = await useAsyncData(nuxtRoute.path, async () => {
  return await useGraphqlQuery('newsOverview', {
    path: nuxtRoute.path,
  }).then((v) => v.data)
})

const { entity } = await useDrupalRoute<NodePageFragment>(query.value ?? null, {
  noError: true,
})

const pressReleases = computed(() => {
  const items = query.value?.entityQuery?.items ?? []
  return items.filter((item): item is NodePressReleaseTeaserFragment => !!item)
})

// The overview has no Drupal metatags of its own; same pattern as node pages.
useHead({
  title: () => `${unref(entity)?.title || 'News'} | Mountain Camp`,
})

setBreadcrumbLinksFromRoute(query.value ?? null)
setPageHasHero(true)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
