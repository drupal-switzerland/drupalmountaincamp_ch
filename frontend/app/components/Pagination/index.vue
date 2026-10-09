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
          @click="onClick($event, currentPage - 1)"
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
          @click="onClick($event, page)"
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
          @click="onClick($event, currentPage + 1)"
        >
          {{ $texts('pagination.next', 'Next') }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts" setup>
import type { RouteLocationRaw } from 'vue-router'
import { isSameTabClick, withPageParam } from '~/helpers/pagination'

const props = defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  /** A pagination link navigates to another page in this tab. */
  navigate: []
}>()

const { $texts } = useEasyTexts()
const route = useRoute()

const pages = computed(() =>
  Array.from({ length: props.totalPages }, (_, i) => i + 1),
)

function onClick(event: MouseEvent, page: number) {
  if (page !== props.currentPage && isSameTabClick(event)) {
    emit('navigate')
  }
}

function linkTo(page: number): RouteLocationRaw {
  return { path: route.path, query: withPageParam(route.query, page) }
}
</script>
