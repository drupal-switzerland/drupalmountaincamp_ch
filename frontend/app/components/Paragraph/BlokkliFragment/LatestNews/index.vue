<template>
  <section
    v-if="pressReleases.length"
    :aria-labelledby="headingId"
    class="container"
  >
    <div class="mx-auto flex max-w-3xl flex-col gap-10">
      <div class="flex flex-wrap items-baseline justify-between gap-4">
        <h2 :id="headingId" class="text-3xl lg:text-4xl">
          {{ $texts('latestNews.title', 'News') }}
        </h2>
        <VuepalLink :to="NEWS_PATH" class="link font-bold">
          {{ $texts('latestNews.all', 'All news') }}
        </VuepalLink>
      </div>
      <NodePressReleaseTeaser
        v-for="pressRelease in pressReleases"
        :key="pressRelease.uuid"
        v-bind="pressRelease"
        heading-tag="h3"
      />
    </div>
  </section>
  <p v-else-if="isEditing" class="container text-gray-600">
    Latest news: no published press releases yet.
  </p>
</template>

<script lang="ts" setup>
import type { NodePressReleaseTeaserFragment } from '#graphql-operations'

const NEWS_PATH = '/news'
const LATEST_NEWS_LIMIT = 3

defineBlokkliFragment({
  name: 'latest_news',
  label: 'Latest news',
  description: 'The newest press releases, updated automatically.',
})

const { $texts } = useEasyTexts()
const headingId = useId()
const isEditing = import.meta.blokkliEditing

const { data } = await useAsyncData('latest-news', () =>
  useGraphqlQuery('latestNews', { limit: LATEST_NEWS_LIMIT }).then(
    (v) => v.data,
  ),
)

const pressReleases = computed(
  () =>
    data.value?.entityQuery.items?.filter(
      (item): item is NodePressReleaseTeaserFragment => !!item,
    ) ?? [],
)
</script>
