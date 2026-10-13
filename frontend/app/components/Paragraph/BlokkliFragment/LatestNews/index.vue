<template>
  <section
    v-if="pressReleases.length"
    :aria-labelledby="headingId"
    class="news-band bg-primary-100 py-16 lg:py-24"
  >
    <div class="container !my-0 flex flex-col gap-10">
      <div class="flex flex-wrap items-baseline justify-between gap-4">
        <h2 :id="headingId" class="text-3xl lg:text-4xl">
          {{ $texts('news.title', 'News') }}
        </h2>
        <VuepalLink :to="NEWS_OVERVIEW_PATH" class="link font-bold">
          {{ $texts('latestNews.all', 'All news') }}
        </VuepalLink>
      </div>
      <ul class="grid gap-6 md:grid-cols-3">
        <li v-for="pressRelease in pressReleases" :key="pressRelease.uuid">
          <NodePressReleaseCard
            v-bind="pressRelease"
            :image-sizes="CARD_IMAGE_SIZES"
          />
        </li>
      </ul>
    </div>
  </section>
  <p v-else-if="isEditing" class="container text-gray-600">
    Latest news: no published press releases yet.
  </p>
</template>

<script lang="ts" setup>
import type { NodePressReleaseTeaserFragment } from '#graphql-operations'
import { buildImageSizes } from '~/helpers/imageSizes'
import { NEWS_OVERVIEW_PATH } from '~/helpers/navigation'
import { SCREENS } from '~/tailwind/screens'

const LATEST_NEWS_LIMIT = 3

// Width of a card's image, inside the card's 3px border on each side.
// - Three cards share the container from md up, with two 24px gaps. The
//   container has 32px padding from md, 48px from lg, and is 1380px wide
//   from xl: (1380 - 96 - 48) / 3 - 6 = 406.
// - Below md a card spans the viewport inside the 16px padding.
const CARD_IMAGE_SIZES = buildImageSizes(
  [
    { minWidth: SCREENS.xl, width: '406px' },
    { minWidth: SCREENS.lg, width: 'calc((100vw - 144px) / 3 - 6px)' },
    { minWidth: SCREENS.md, width: 'calc((100vw - 112px) / 3 - 6px)' },
  ],
  'calc(100vw - 38px)',
)

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
