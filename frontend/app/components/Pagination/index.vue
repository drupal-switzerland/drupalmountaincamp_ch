<template>
  <nav
    v-if="totalPages > 1"
    :aria-label="$texts('pagination.label', 'Pagination')"
    class="flex justify-center"
  >
    <ul class="flex flex-wrap items-center justify-center gap-2">
      <!-- Every link sets aria-current itself: RouterLink ignores the query
           and would mark all links to this path as the current page. -->
      <li v-if="currentPage > 1">
        <NuxtLink
          :to="linkTo(currentPage - 1)"
          :aria-current="undefined"
          rel="prev"
          class="inline-flex min-h-11 items-center rounded-full border-2 border-primary-100 px-4 font-bold text-primary-500 hover:border-primary-400"
        >
          {{ $texts('pagination.previous', 'Previous') }}
        </NuxtLink>
      </li>
      <li v-for="page in pages" :key="page">
        <NuxtLink
          :to="linkTo(page)"
          :aria-current="page === currentPage ? 'page' : undefined"
          class="inline-flex size-11 items-center justify-center rounded-full border-2 font-bold"
          :class="
            page === currentPage
              ? 'border-primary-500 bg-primary-500 text-white'
              : 'border-primary-100 text-primary-500 hover:border-primary-400'
          "
        >
          <span class="sr-only">{{ $texts('pagination.page', 'Page') }}</span>
          {{ page }}
        </NuxtLink>
      </li>
      <li v-if="currentPage < totalPages">
        <NuxtLink
          :to="linkTo(currentPage + 1)"
          :aria-current="undefined"
          rel="next"
          class="inline-flex min-h-11 items-center rounded-full border-2 border-primary-100 px-4 font-bold text-primary-500 hover:border-primary-400"
        >
          {{ $texts('pagination.next', 'Next') }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const { $texts } = useEasyTexts()
const route = useRoute()

const pages = computed(() =>
  Array.from({ length: props.totalPages }, (_, i) => i + 1),
)

// Page 1 is the plain URL, so it has a single canonical address.
function linkTo(page: number): RouteLocationRaw {
  const query = { ...route.query }
  delete query.page
  if (page > 1) {
    query.page = String(page)
  }
  return { path: route.path, query }
}
</script>
