<template>
  <div>
    <PageHero :title="entity?.title || 'News'" />

    <div class="container">
      <div
        v-if="pressReleases.length"
        ref="results"
        tabindex="-1"
        class="mx-auto max-w-3xl scroll-mt-28 space-y-10"
      >
        <NodePressReleaseTeaser
          v-for="item in pressReleases"
          :key="item.uuid"
          v-bind="item"
        />
      </div>
      <Pagination
        class="mt-12"
        :current-page="currentPage"
        :total-pages="pageCount"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type {
  NodePressReleaseTeaserFragment,
  NodePageFragment,
} from '#graphql-operations'
import { parsePageParam, totalPages } from '~/helpers/pagination'

const PAGE_SIZE = 10

defineOptions({
  name: 'PageNewsOverview',
})

definePageMeta({
  name: 'news-overview',
})

const { $texts } = useEasyTexts()
const nuxtRoute = useRoute()
const currentPage = computed(() => parsePageParam(nuxtRoute.query.page))

// Reactive key: ?page= changes reuse this component and refetch.
const { data: query } = await useAsyncData(
  () => `${nuxtRoute.path}?page=${currentPage.value}`,
  () =>
    useGraphqlQuery('newsOverview', {
      path: nuxtRoute.path,
      limit: PAGE_SIZE,
      offset: (currentPage.value - 1) * PAGE_SIZE,
    }).then((v) => v.data),
)

const { entity } = await useDrupalRoute<NodePageFragment>(query.value ?? null, {
  noError: true,
})

const pageCount = computed(() =>
  totalPages(query.value?.entityQuery?.total ?? 0, PAGE_SIZE),
)

if (currentPage.value > pageCount.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}
// The component is reused for ?page= changes during client navigation.
watch([currentPage, pageCount], ([page, count]) => {
  if (page > count) {
    showError({ statusCode: 404, statusMessage: 'Page not found' })
  }
})

// The router doesn't scroll on query-only changes: bring the new results into
// view and move focus there, so keyboard and screen reader users continue at
// the list instead of the pagination link they activated.
const results = ref<HTMLElement | null>(null)
watch(currentPage, async () => {
  await nextTick()
  results.value?.scrollIntoView({ block: 'start' })
  results.value?.focus({ preventScroll: true })
})

const pressReleases = computed(() => {
  const items = query.value?.entityQuery?.items ?? []
  return items.filter((item): item is NodePressReleaseTeaserFragment => !!item)
})

// The overview has no Drupal metatags of its own; same pattern as node pages.
useHead({
  title: () => {
    const title = unref(entity)?.title || 'News'
    const page =
      currentPage.value > 1
        ? ` – ${$texts('pagination.page', 'Page')} ${currentPage.value}`
        : ''
    return `${title}${page} | Mountain Camp`
  },
})

setBreadcrumbLinksFromRoute(query.value ?? null)
setPageHasHero(true)
setLanguageLinksFromRoute(query.value ?? null)
await renderPageDependencies()
</script>
