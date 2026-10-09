<template>
  <div>
    <PageHero :title="entity?.title || 'News'" />

    <div class="container">
      <div ref="results" tabindex="-1" class="mx-auto max-w-3xl scroll-mt-28">
        <p v-if="listFailed" class="text-lg">
          {{
            $texts(
              'news.loadError',
              'The news could not be loaded. Please try again later.',
            )
          }}
        </p>
        <div v-else class="space-y-10">
          <NodePressReleaseTeaser
            v-for="item in pressReleases"
            :key="item.uuid"
            v-bind="item"
          />
        </div>
      </div>
      <Pagination
        class="mt-12"
        :current-page="currentPage"
        :total-pages="pageCount"
        @navigate="focusResultsOnLoad = true"
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
// The list offset is a GraphQL Int (32-bit signed).
const MAX_OFFSET = 2_147_483_647

defineOptions({
  name: 'PageNewsOverview',
})

definePageMeta({
  name: 'news-overview',
  middleware: 'canonical-page-param',
})

const { $texts } = useEasyTexts()
const nuxtRoute = useRoute()
const currentPage = computed(() => parsePageParam(nuxtRoute.query.page))
const isPageInRange = computed(
  () => (currentPage.value - 1) * PAGE_SIZE <= MAX_OFFSET,
)

// Route data (title, breadcrumb, metatags) once; the list per page. Reactive
// list key: ?page= changes reuse this component and only refetch the list.
const [{ data: query }, { data: list, status: listStatus }] = await Promise.all(
  [
    useAsyncData(nuxtRoute.path, () =>
      useGraphqlQuery('newsOverview', { path: nuxtRoute.path }).then(
        (v) => v.data,
      ),
    ),
    useAsyncData(
      () => `news-list:${currentPage.value}`,
      async () =>
        isPageInRange.value
          ? useGraphqlQuery('newsList', {
              limit: PAGE_SIZE,
              offset: (currentPage.value - 1) * PAGE_SIZE,
            }).then((v) => v.data)
          : null,
    ),
  ],
)

const { entity } = await useDrupalRoute<NodePageFragment>(query.value ?? null, {
  noError: true,
})

const pageCount = computed(() =>
  totalPages(list.value?.entityQuery?.total ?? 0, PAGE_SIZE),
)

// Only a successfully loaded list can say a page doesn't exist; a failed
// request must not turn into a 404.
const isBeyondLastPage = computed(
  () =>
    !isPageInRange.value ||
    (!!list.value?.entityQuery && currentPage.value > pageCount.value),
)
const notFound = { statusCode: 404, statusMessage: 'Page not found' }
if (isBeyondLastPage.value) {
  throw createError({ ...notFound, fatal: true })
}
// The component is reused for ?page= changes during client navigation.
watch(isBeyondLastPage, (beyond) => {
  if (beyond) {
    showError(notFound)
  }
})

// A request error or a response without the list (GraphQL errors).
const listFailed = computed(
  () =>
    !isBeyondLastPage.value &&
    (listStatus.value === 'error' ||
      (listStatus.value === 'success' && !list.value?.entityQuery)),
)
// 503 and private, so neither the route cache (200 only) nor the CDN keeps
// the error page.
if (import.meta.server && listFailed.value) {
  const event = useRequestEvent()
  if (event) {
    setResponseStatus(event, 503)
  }
  useCDNHeaders((helper) => helper.private(), event)
}

const pressReleases = computed(() => {
  const items = list.value?.entityQuery?.items ?? []
  return items.filter((item): item is NodePressReleaseTeaserFragment => !!item)
})

// After a pagination link (not Back/Forward or other links to /news), bring
// the new results into view and move focus there, so keyboard and screen
// reader users continue at the list. The router doesn't scroll on
// query-only changes.
const results = ref<HTMLElement | null>(null)
const focusResultsOnLoad = ref(false)
watch(pressReleases, async () => {
  if (!focusResultsOnLoad.value) {
    return
  }
  focusResultsOnLoad.value = false
  await nextTick()
  results.value?.scrollIntoView({ block: 'start' })
  results.value?.focus({ preventScroll: true })
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
